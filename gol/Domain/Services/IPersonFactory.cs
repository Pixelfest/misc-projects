namespace gol.Domain.Services;

using gol.Domain.Entities;

public interface IPersonFactory
{
    Person CreatePerson();
    List<Person> CreatePeople(int count);
    Person CreateChild(Person parent1, Person parent2, DateTime birthDate);
}
