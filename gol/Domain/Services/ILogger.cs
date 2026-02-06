namespace gol.Domain.Services;

public enum LogLevel
{
    None = 0,      // No logging
    Critical = 1,  // Only critical messages (errors, simulation start/end)
    Important = 2, // Important events (year summaries, major milestones)
    Normal = 3,    // Normal events (deaths, births, relationships)
    Detailed = 4,  // All details (debug info)
    Verbose = 5    // Everything
}

public interface ILogger
{
    void Log(string message, LogLevel level = LogLevel.Normal);
    void SetLogLevel(LogLevel level);
}
