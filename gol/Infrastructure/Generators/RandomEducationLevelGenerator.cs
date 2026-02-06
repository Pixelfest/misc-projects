namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomEducationLevelGenerator : IEducationLevelGenerator
{
    private static readonly Random _random = new Random();
    private static readonly string[] EducationLevels = { "High School", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate" };

    public string Generate()
    {
        return EducationLevels[_random.Next(EducationLevels.Length)];
    }
}
