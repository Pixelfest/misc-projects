namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomGenderGenerator : IGenderGenerator
{
    private static readonly Random _random = new Random();

    public string Generate()
    {
        return _random.Next(2) == 0 ? "Male" : "Female";
    }
}
