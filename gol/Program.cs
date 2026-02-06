using gol.Domain.Services;
using gol.Domain.Services.Generators;
using gol.Infrastructure.Factories;
using gol.Infrastructure.Generators;
using gol.Infrastructure.Services;

namespace gol;

class Program
{
    static void Main(string[] args)
    {
        // Load settings
        var settings = new Settings();

        // Setup logger
        ILogger logger = new ConsoleLogger(settings.LogLevel);

        // Dependency injection setup
        INameGenerator nameGenerator = new RandomNameGenerator();
        IBirthDateGenerator birthDateGenerator = new RandomBirthDateGenerator();
        ILocationGenerator locationGenerator = new RandomLocationGenerator();
        IGenderGenerator genderGenerator = new RandomGenderGenerator();
        ILicensesGenerator licensesGenerator = new RandomLicensesGenerator();
        IEducationLevelGenerator educationLevelGenerator = new RandomEducationLevelGenerator();
        IHobbiesGenerator hobbiesGenerator = new RandomHobbiesGenerator();

        IPersonFactory personFactory = new PersonFactory(
            nameGenerator,
            birthDateGenerator,
            locationGenerator,
            genderGenerator,
            licensesGenerator,
            educationLevelGenerator,
            hobbiesGenerator
        );

        IStatisticsService statisticsService = new StatisticsService(logger);
        IPartnerMatchingService partnerMatchingService = new PartnerMatchingService(settings, logger);
        IGameLoopService gameLoopService = new GameLoopService(partnerMatchingService, statisticsService, personFactory, settings, logger);

        // Generate people
        var people = personFactory.CreatePeople(settings.InitialPopulation);
        logger.Log($"Generated {people.Count} people.", LogLevel.Critical);
        logger.Log($"Starting date: {DateTime.Now.Date:yyyy-MM-dd}", LogLevel.Critical);
        logger.Log("Running simulation...\n", LogLevel.Critical);

        // Run game loop
        int daysToSimulate = 365 * settings.YearsToSimulate;
        gameLoopService.RunDays(people, daysToSimulate);

        logger.Log($"Simulation completed: {daysToSimulate} days simulated.", LogLevel.Critical);
        logger.Log($"End date: {DateTime.Now.Date.AddDays(daysToSimulate):yyyy-MM-dd}", LogLevel.Critical);

        // Display summary
        statisticsService.DisplaySummary(people);
    }
}
