namespace gol.Infrastructure.Factories;

using gol.Domain.Entities;
using gol.Domain.Services;
using gol.Domain.Services.Generators;

public class PersonFactory : IPersonFactory
{
    private readonly INameGenerator _nameGenerator;
    private readonly IBirthDateGenerator _birthDateGenerator;
    private readonly IGenderGenerator _genderGenerator;
    private readonly IHobbiesGenerator _hobbiesGenerator;

    public PersonFactory(
        INameGenerator nameGenerator,
        IBirthDateGenerator birthDateGenerator,
        IGenderGenerator genderGenerator,
        IHobbiesGenerator hobbiesGenerator)
    {
        _nameGenerator = nameGenerator;
        _birthDateGenerator = birthDateGenerator;
        _genderGenerator = genderGenerator;
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
            gender,
            _hobbiesGenerator.Generate()
        );
    }

    public List<Person> CreatePeople(int count)
    {
        var people = new List<Person>(count);
        for (int i = 0; i < count; i++)
        {
            people.Add(CreatePerson());
        }
        return people;
    }

    public Person CreateChild(Person parent1, Person parent2, DateTime birthDate)
    {
        var gender = _genderGenerator.Generate();
        var firstName = _nameGenerator.Generate(gender);
        var lastName = parent1.LastName;
        var hobbies = new List<string>();

        var child = new Person(firstName, lastName, birthDate, gender, hobbies);
        child.SetParents(parent1, parent2);

        return child;
    }
}
