namespace gol.Infrastructure.Factories;

using gol.Domain.Entities;
using gol.Domain.Services;
using gol.Domain.Services.Generators;

public class PersonFactory : IPersonFactory
{
    private readonly INameGenerator _nameGenerator;
    private readonly IBirthDateGenerator _birthDateGenerator;
    private readonly ILocationGenerator _locationGenerator;
    private readonly IGenderGenerator _genderGenerator;
    private readonly ILicensesGenerator _licensesGenerator;
    private readonly IEducationLevelGenerator _educationLevelGenerator;
    private readonly IHobbiesGenerator _hobbiesGenerator;

    public PersonFactory(
        INameGenerator nameGenerator,
        IBirthDateGenerator birthDateGenerator,
        ILocationGenerator locationGenerator,
        IGenderGenerator genderGenerator,
        ILicensesGenerator licensesGenerator,
        IEducationLevelGenerator educationLevelGenerator,
        IHobbiesGenerator hobbiesGenerator)
    {
        _nameGenerator = nameGenerator;
        _birthDateGenerator = birthDateGenerator;
        _locationGenerator = locationGenerator;
        _genderGenerator = genderGenerator;
        _licensesGenerator = licensesGenerator;
        _educationLevelGenerator = educationLevelGenerator;
        _hobbiesGenerator = hobbiesGenerator;
    }

    public Person CreatePerson()
    {
        var gender = _genderGenerator.Generate();
        var (firstName, lastName) = _nameGenerator.GenerateFullName(gender);
        return new Person(
            firstName,
            lastName,
            _birthDateGenerator.Generate(),
            _locationGenerator.Generate(),
            gender,
            _licensesGenerator.Generate(),
            _educationLevelGenerator.Generate(),
            _hobbiesGenerator.Generate()
        );
    }

    public List<Person> CreatePeople(int count)
    {
        var people = new List<Person>();
        for (int i = 0; i < count; i++)
        {
            people.Add(CreatePerson());
        }
        return people;
    }

    public Person CreateChild(Person parent1, Person parent2, DateTime birthDate)
    {
        // Child inherits location from parents
        var location = parent1.Location;

        // Child's gender is randomly determined
        var gender = _genderGenerator.Generate();

        // Child's first name is generated based on gender
        var firstName = _nameGenerator.Generate(gender);

        // Child inherits last name from parent1
        var lastName = parent1.LastName;

        // Children start with no licenses, basic education, and age-appropriate hobbies
        var licenses = new List<string>();
        var educationLevel = "None"; // Will change as they age
        var hobbies = new List<string>(); // Will develop hobbies as they grow

        var child = new Person(firstName, lastName, birthDate, location, gender, licenses, educationLevel, hobbies);
        child.SetParents(parent1, parent2);

        return child;
    }
}
