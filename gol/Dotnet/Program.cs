using gol.Domain.Services;
using gol.Domain.Services.Generators;
using gol.Infrastructure.Factories;
using gol.Infrastructure.Generators;
using gol.Infrastructure.Services;

namespace gol;

class Program
{
    private static void Main()
    {
        var settings = new Settings();
        var services = ConfigureServices(settings);

        var people = services.PersonFactory.CreatePeople(settings.InitialPopulation);

        services.Logger.Log($"Generated {people.Count} people.", LogLevel.Critical);
        services.Logger.Log($"Starting date: {DateTime.Now.Date:yyyy-MM-dd}", LogLevel.Critical);
        services.Logger.Log("Running simulation...\n", LogLevel.Critical);

        // Run the sim
        int daysToSimulate = 365 * settings.YearsToSimulate;
        services.GameLoopService.RunDays(people, daysToSimulate);

        services.Logger.Log($"Simulation completed: {daysToSimulate} days simulated.", LogLevel.Critical);
        services.Logger.Log($"End date: {DateTime.Now.Date.AddDays(daysToSimulate):yyyy-MM-dd}", LogLevel.Critical);

        services.StatisticsService.DisplaySummary(people);
    }

    private static ServiceContainer ConfigureServices(Settings settings)
    {
        ILogger logger = new ConsoleLogger(settings.LogLevel);
        INameGenerator nameGenerator = new RandomNameGenerator();
        IBirthDateGenerator birthDateGenerator = new RandomBirthDateGenerator();
        IGenderGenerator genderGenerator = new RandomGenderGenerator();
        IHobbiesGenerator hobbiesGenerator = new RandomHobbiesGenerator();

        IPersonFactory personFactory = new PersonFactory(
            nameGenerator,
            birthDateGenerator,
            genderGenerator,
            hobbiesGenerator
        );

        IStatisticsService statisticsService = new StatisticsService(logger);
        IPartnerMatchingService partnerMatchingService = new PartnerMatchingService(settings, logger);
        IGameLoopService gameLoopService = new GameLoopService(partnerMatchingService, statisticsService, personFactory, settings, logger);

        return new ServiceContainer(logger, personFactory, statisticsService, gameLoopService);
    }

    private record ServiceContainer(
        ILogger Logger,
        IPersonFactory PersonFactory,
        IStatisticsService StatisticsService,
        IGameLoopService GameLoopService
    );
}
