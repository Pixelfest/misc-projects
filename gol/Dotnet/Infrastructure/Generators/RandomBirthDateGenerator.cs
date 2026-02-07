namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomBirthDateGenerator : IBirthDateGenerator
{
    private static readonly Random Random = new();

    public DateTime Generate()
    {
        var age = Random.Next(18, 80);
        return DateTime.Now.AddYears(-age).AddDays(Random.Next(-365, 365));
    }
}
