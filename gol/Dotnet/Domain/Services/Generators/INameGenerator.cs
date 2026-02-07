namespace gol.Domain.Services.Generators;

public interface INameGenerator
{
    string Generate(string gender);
    (string firstName, string lastName) GenerateFullName(string gender);
}
