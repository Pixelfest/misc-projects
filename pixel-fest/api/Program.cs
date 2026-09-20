using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Npgsql;

// See docs/adr/0002-library-link-is-the-only-credential.md and docs/adr/0003-dotnet-api-and-postgres-for-cloud-storage.md

const int MaxProjectsPerLibrary = 250;
const int MaxDataBytes = 1_000_000;
const int MaxThumbnailChars = 32_768;
const int MaxNameChars = 100;
const int MaxCanvas = 128;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(k => k.Limits.MaxRequestBodySize = 2 * 1024 * 1024);

var connectionString = builder.Configuration.GetConnectionString("Db")
    ?? throw new InvalidOperationException("ConnectionStrings:Db is not configured.");
builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));
builder.Services.AddHostedService<Schema>();
builder.Services.AddHostedService<PurgeInactiveLibraries>();

// Runs behind nginx on a private Docker network, so forwarded headers are trusted.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    string Ip(HttpContext c) => c.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(c =>
        RateLimitPartition.GetFixedWindowLimiter("all:" + Ip(c), _ => new FixedWindowRateLimiterOptions { PermitLimit = 600, Window = TimeSpan.FromMinutes(1) }));
    o.AddPolicy("create-library", c =>
        RateLimitPartition.GetFixedWindowLimiter(Ip(c), _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromHours(1) }));
});

var app = builder.Build();
app.UseForwardedHeaders();
app.UseRateLimiter();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok());

api.MapPost("/libraries", async (NpgsqlDataSource db) =>
{
    var secret = Guid.NewGuid();
    await using var cmd = db.CreateCommand("INSERT INTO libraries (secret_hash) VALUES (@h)");
    cmd.Parameters.AddWithValue("h", Hash(secret));
    await cmd.ExecuteNonQueryAsync();
    // The only time the secret is ever handled in the clear: it is returned once and not stored.
    return Results.Ok(new { secret });
}).RequireRateLimiting("create-library");

api.MapGet("/library", async (HttpContext ctx, NpgsqlDataSource db) =>
{
    if (await Authenticate(ctx, db) is not { } lib) return Results.NotFound();
    await using var cmd = db.CreateCommand(
        "SELECT id, name, width, height, frame_count, thumbnail, revision, created_at, updated_at FROM projects WHERE library_id = @l ORDER BY updated_at DESC");
    cmd.Parameters.AddWithValue("l", lib);
    var list = new List<ProjectSummary>();
    await using var r = await cmd.ExecuteReaderAsync();
    while (await r.ReadAsync())
        list.Add(new(r.GetGuid(0), r.GetString(1), r.GetInt32(2), r.GetInt32(3), r.GetInt32(4), r.GetString(5), r.GetInt32(6), r.GetFieldValue<DateTimeOffset>(7), r.GetFieldValue<DateTimeOffset>(8)));
    return Results.Ok(new { maxProjects = MaxProjectsPerLibrary, projects = list });
});

api.MapDelete("/library", async (HttpContext ctx, NpgsqlDataSource db) =>
{
    if (await Authenticate(ctx, db) is not { } lib) return Results.NotFound();
    await using var cmd = db.CreateCommand("DELETE FROM libraries WHERE id = @l");
    cmd.Parameters.AddWithValue("l", lib);
    await cmd.ExecuteNonQueryAsync();
    return Results.NoContent();
});

api.MapPost("/projects", async (HttpContext ctx, NpgsqlDataSource db, ProjectInput input) =>
{
    if (await Authenticate(ctx, db) is not { } lib) return Results.NotFound();
    if (Validate(input) is { } problem) return problem;

    await using var conn = await db.OpenConnectionAsync();
    await using var tx = await conn.BeginTransactionAsync();

    // Lock the Library row so two concurrent creates cannot both squeeze past the cap.
    await using (var lockCmd = new NpgsqlCommand("SELECT 1 FROM libraries WHERE id = @l FOR UPDATE", conn, tx))
    {
        lockCmd.Parameters.AddWithValue("l", lib);
        await lockCmd.ExecuteNonQueryAsync();
    }
    await using (var countCmd = new NpgsqlCommand("SELECT count(*) FROM projects WHERE library_id = @l", conn, tx))
    {
        countCmd.Parameters.AddWithValue("l", lib);
        if ((long)(await countCmd.ExecuteScalarAsync())! >= MaxProjectsPerLibrary)
            return Results.Json(new { error = $"A Library holds at most {MaxProjectsPerLibrary} Projects." }, statusCode: StatusCodes.Status409Conflict);
    }

    await using var insert = new NpgsqlCommand(
        "INSERT INTO projects (library_id, name, width, height, frame_count, thumbnail, data) VALUES (@l, @n, @w, @h, @f, @t, @d) RETURNING id, revision, updated_at", conn, tx);
    Bind(insert, input);
    insert.Parameters.AddWithValue("l", lib);
    await using var r = await insert.ExecuteReaderAsync();
    await r.ReadAsync();
    var result = new { id = r.GetGuid(0), revision = r.GetInt32(1), updatedAt = r.GetFieldValue<DateTimeOffset>(2) };
    await r.CloseAsync();
    await tx.CommitAsync();
    return Results.Ok(result);
});

api.MapGet("/projects/{id:guid}", async (Guid id, HttpContext ctx, NpgsqlDataSource db) =>
{
    if (await Authenticate(ctx, db) is not { } lib) return Results.NotFound();
    await using var cmd = db.CreateCommand("SELECT name, revision, updated_at, data FROM projects WHERE id = @id AND library_id = @l");
    cmd.Parameters.AddWithValue("id", id);
    cmd.Parameters.AddWithValue("l", lib);
    await using var r = await cmd.ExecuteReaderAsync();
    if (!await r.ReadAsync()) return Results.NotFound();
    return Results.Ok(new { id, name = r.GetString(0), revision = r.GetInt32(1), updatedAt = r.GetFieldValue<DateTimeOffset>(2), data = r.GetString(3) });
});

// Optimistic concurrency: the caller sends the revision it started from in If-Match.
api.MapPut("/projects/{id:guid}", async (Guid id, HttpContext ctx, NpgsqlDataSource db, ProjectInput input) =>
{
    if (await Authenticate(ctx, db) is not { } lib) return Results.NotFound();
    if (Validate(input) is { } problem) return problem;
    if (!int.TryParse(ctx.Request.Headers.IfMatch.ToString().Trim('"'), out var expected))
        return Results.BadRequest(new { error = "If-Match must hold the revision the save started from." });

    await using var cmd = db.CreateCommand(
        """
        UPDATE projects SET name = @n, width = @w, height = @h, frame_count = @f, thumbnail = @t, data = @d,
                            revision = revision + 1, updated_at = now()
        WHERE id = @id AND library_id = @l AND revision = @rev
        RETURNING revision, updated_at
        """);
    Bind(cmd, input);
    cmd.Parameters.AddWithValue("id", id);
    cmd.Parameters.AddWithValue("l", lib);
    cmd.Parameters.AddWithValue("rev", expected);
    await using (var r = await cmd.ExecuteReaderAsync())
    {
        if (await r.ReadAsync()) return Results.Ok(new { revision = r.GetInt32(0), updatedAt = r.GetFieldValue<DateTimeOffset>(1) });
    }

    await using var probe = db.CreateCommand("SELECT revision FROM projects WHERE id = @id AND library_id = @l");
    probe.Parameters.AddWithValue("id", id);
    probe.Parameters.AddWithValue("l", lib);
    return await probe.ExecuteScalarAsync() is int current
        ? Results.Json(new { error = "This Project was changed elsewhere.", revision = current }, statusCode: StatusCodes.Status409Conflict)
        : Results.NotFound();
});

api.MapDelete("/projects/{id:guid}", async (Guid id, HttpContext ctx, NpgsqlDataSource db) =>
{
    if (await Authenticate(ctx, db) is not { } lib) return Results.NotFound();
    await using var cmd = db.CreateCommand("DELETE FROM projects WHERE id = @id AND library_id = @l");
    cmd.Parameters.AddWithValue("id", id);
    cmd.Parameters.AddWithValue("l", lib);
    return await cmd.ExecuteNonQueryAsync() == 0 ? Results.NotFound() : Results.NoContent();
});

app.Run();

static byte[] Hash(Guid secret) => SHA256.HashData(secret.ToByteArray());

/// <summary>Resolves the Library for a request's Bearer secret, or null. An unknown and a malformed secret are indistinguishable.</summary>
static async Task<Guid?> Authenticate(HttpContext ctx, NpgsqlDataSource db)
{
    var header = ctx.Request.Headers.Authorization.ToString();
    if (!header.StartsWith("Bearer ", StringComparison.Ordinal) || !Guid.TryParse(header.AsSpan(7), out var secret)) return null;

    await using var find = db.CreateCommand("SELECT id, last_accessed_at FROM libraries WHERE secret_hash = @h");
    find.Parameters.AddWithValue("h", Hash(secret));
    await using var r = await find.ExecuteReaderAsync();
    if (!await r.ReadAsync()) return null;
    var id = r.GetGuid(0);
    var stale = r.GetFieldValue<DateTimeOffset>(1) < DateTimeOffset.UtcNow.AddDays(-1);
    await r.CloseAsync();

    // Recording activity at most once a day keeps reads from turning into writes.
    if (stale)
    {
        await using var touch = db.CreateCommand("UPDATE libraries SET last_accessed_at = now() WHERE id = @id");
        touch.Parameters.AddWithValue("id", id);
        await touch.ExecuteNonQueryAsync();
    }
    return id;
}

static IResult? Validate(ProjectInput p)
{
    if (string.IsNullOrWhiteSpace(p.Name) || p.Name.Length > MaxNameChars) return Problem($"Name must be 1-{MaxNameChars} characters.");
    if (p.Width is < 1 or > MaxCanvas || p.Height is < 1 or > MaxCanvas) return Problem($"Canvas size must be 1-{MaxCanvas} pixels.");
    if (p.FrameCount < 1) return Problem("A Project needs at least one Frame.");
    if ((p.Thumbnail?.Length ?? 0) > MaxThumbnailChars) return Problem("Thumbnail is too large.");
    if (string.IsNullOrEmpty(p.Data)) return Problem("Project data is missing.");
    if (Encoding.UTF8.GetByteCount(p.Data) > MaxDataBytes)
        return Results.Json(new { error = "This Project is larger than 1 MB." }, statusCode: StatusCodes.Status413PayloadTooLarge);
    return null;

    static IResult Problem(string message) => Results.BadRequest(new { error = message });
}

static void Bind(NpgsqlCommand cmd, ProjectInput p)
{
    cmd.Parameters.AddWithValue("n", p.Name);
    cmd.Parameters.AddWithValue("w", p.Width);
    cmd.Parameters.AddWithValue("h", p.Height);
    cmd.Parameters.AddWithValue("f", p.FrameCount);
    cmd.Parameters.AddWithValue("t", p.Thumbnail ?? "");
    cmd.Parameters.AddWithValue("d", p.Data);
}

record ProjectInput(string Name, int Width, int Height, int FrameCount, string? Thumbnail, string Data);

record ProjectSummary(Guid Id, string Name, int Width, int Height, int FrameCount, string Thumbnail, int Revision, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

/// <summary>Creates the tables on startup, retrying while Postgres is still coming up.</summary>
class Schema(NpgsqlDataSource db, ILogger<Schema> log) : IHostedService
{
    const string Sql = """
        CREATE TABLE IF NOT EXISTS libraries (
            id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            secret_hash      bytea NOT NULL UNIQUE,
            created_at       timestamptz NOT NULL DEFAULT now(),
            last_accessed_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS projects (
            id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            library_id  uuid NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
            name        text NOT NULL,
            width       int NOT NULL,
            height      int NOT NULL,
            frame_count int NOT NULL,
            thumbnail   text NOT NULL DEFAULT '',
            data        text NOT NULL,
            revision    int NOT NULL DEFAULT 1,
            created_at  timestamptz NOT NULL DEFAULT now(),
            updated_at  timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS projects_library_idx ON projects (library_id);
        """;

    public async Task StartAsync(CancellationToken ct)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await using var cmd = db.CreateCommand(Sql);
                await cmd.ExecuteNonQueryAsync(ct);
                return;
            }
            catch (Exception e) when (attempt < 30)
            {
                log.LogWarning("Database not ready (attempt {Attempt}): {Message}", attempt, e.Message);
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
            }
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}

/// <summary>Deletes Libraries nobody has opened for 12 months, so abandoned Libraries do not accumulate forever.</summary>
class PurgeInactiveLibraries(NpgsqlDataSource db, ILogger<PurgeInactiveLibraries> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));
        do
        {
            try
            {
                await using var cmd = db.CreateCommand("DELETE FROM libraries WHERE last_accessed_at < now() - interval '12 months'");
                var removed = await cmd.ExecuteNonQueryAsync(ct);
                if (removed > 0) log.LogInformation("Purged {Count} inactive Libraries", removed);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                log.LogWarning("Purge failed: {Message}", e.Message);
            }
        } while (await timer.WaitForNextTickAsync(ct));
    }
}
