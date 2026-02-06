namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomNameGenerator : INameGenerator
{
    private static readonly Random Random = new();
    private static readonly string[] MaleNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Brian", "George", "Kevin", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin"
    ];
    private static readonly string[] FemaleNames = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", "Dorothy", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen", "Amy", "Angela", "Shirley", "Anna", "Brenda", "Pamela", "Emma", "Nicole", "Helen"
    ];
    private static readonly string[] LastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Hall", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell"
    ];

    private static readonly HashSet<string> UsedNames = [];

    public string Generate(string gender)
    {
        if (gender == "Male")
            return MaleNames[Random.Next(MaleNames.Length)];
        else if (gender == "Female")
            return FemaleNames[Random.Next(FemaleNames.Length)];
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
            lastName = LastNames[Random.Next(LastNames.Length)];
            fullName = $"{firstName} {lastName}";
            attempts++;

            if (attempts > 100)
            {
                fullName = $"{firstName} {lastName}{Random.Next(1000, 9999)}";
                lastName = $"{lastName}{Random.Next(1000, 9999)}";
                break;
            }
        } while (UsedNames.Contains(fullName));

        UsedNames.Add(fullName);
        return (firstName, lastName);
    }
}
