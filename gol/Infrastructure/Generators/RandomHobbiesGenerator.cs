namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomHobbiesGenerator : IHobbiesGenerator
{
    private static readonly Random _random = new Random();
    private static readonly string[] HobbyOptions = { "Reading", "Gaming", "Cooking", "Sports", "Photography", "Traveling", "Music", "Painting", "Gardening", "Hiking" };

    public List<string> Generate()
    {
        var hobbies = new List<string>();
        var count = _random.Next(1, 6);
        var availableHobbies = HobbyOptions.ToList();

        for (int i = 0; i < count && availableHobbies.Count > 0; i++)
        {
            var index = _random.Next(availableHobbies.Count);
            hobbies.Add(availableHobbies[index]);
            availableHobbies.RemoveAt(index);
        }

        return hobbies;
    }
}
