namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomNameGenerator : INameGenerator
{
    private static readonly Random _random = new Random();
    private static readonly string[] MaleNames = { "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth" };
    private static readonly string[] FemaleNames = { "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle" };
    private static readonly string[] LastNames = { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Hall", "Young" };

    private static HashSet<string> _usedNames = new HashSet<string>();

    public string Generate(string gender)
    {
        if (gender == "Male")
            return MaleNames[_random.Next(MaleNames.Length)];
        else if (gender == "Female")
            return FemaleNames[_random.Next(FemaleNames.Length)];
        else
            throw new ArgumentException("Gender must be either Male or Female.", nameof(gender));
    }

    public (string firstName, string lastName) GenerateFullName(string gender)
    {
        string firstName;
        string lastName;
        string fullName;
        int attempts = 0;

        do
        {
            firstName = Generate(gender);
            lastName = LastNames[_random.Next(LastNames.Length)];
            fullName = $"{firstName} {lastName}";
            attempts++;

            // If we've tried too many times, add a number suffix to make it unique
            if (attempts > 100)
            {
                fullName = $"{firstName} {lastName}{_random.Next(1000, 9999)}";
                lastName = $"{lastName}{_random.Next(1000, 9999)}";
                break;
            }
        } while (_usedNames.Contains(fullName));

        _usedNames.Add(fullName);
        return (firstName, lastName);
    }
}
