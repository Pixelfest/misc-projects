namespace gol.Infrastructure.Generators;

using gol.Domain.Services.Generators;

public class RandomLicensesGenerator : ILicensesGenerator
{
    private static readonly Random _random = new Random();
    private static readonly string[] LicenseOptions = { "Driver's License", "Motorcycle License", "Commercial Driver's License", "Pilot License", "Professional License" };

    public List<string> Generate()
    {
        var licenses = new List<string>();
        var count = _random.Next(0, 4);
        var availableLicenses = LicenseOptions.ToList();

        for (int i = 0; i < count && availableLicenses.Count > 0; i++)
        {
            var index = _random.Next(availableLicenses.Count);
            licenses.Add(availableLicenses[index]);
            availableLicenses.RemoveAt(index);
        }

        return licenses;
    }
}
