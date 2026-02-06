namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomGenderGenerator : IGenderGenerator
{
    private static readonly Random Random = new();

    public string Generate()
    {
        return Random.Next(2) == 0 ? "Male" : "Female";
    }
}
