namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomBirthDateGenerator : IBirthDateGenerator
{
    private static readonly Random _random = new Random();

    public DateTime Generate()
    {
        var age = _random.Next(18, 80);
        return DateTime.Now.AddYears(-age).AddDays(_random.Next(-365, 365));
    }
}
