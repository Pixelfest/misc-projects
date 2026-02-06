namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomLocationGenerator : ILocationGenerator
{
    private static readonly Random _random = new Random();
    private static readonly string[] Locations = { "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin" };

    public string Generate()
    {
        return Locations[_random.Next(Locations.Length)];
    }
}
