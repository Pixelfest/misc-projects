namespace gol.Infrastructure.Services;

using System.Diagnostics;
using gol.Domain.Entities;
using gol.Domain.Services;

public class GameLoopService : IGameLoopService
{
    private readonly IPartnerMatchingService _partnerMatchingService;
    private readonly IStatisticsService _statisticsService;
    private readonly IPersonFactory _personFactory;
    private readonly Settings _settings;
    private readonly ILogger _logger;
    private DateTime _currentDate;

    public GameLoopService(IPartnerMatchingService partnerMatchingService, IStatisticsService statisticsService, IPersonFactory personFactory, Settings settings, ILogger logger)
    {
        _partnerMatchingService = partnerMatchingService;
        _statisticsService = statisticsService;
        _personFactory = personFactory;
        _settings = settings;
        _logger = logger;
        _currentDate = DateTime.Now.Date;
    }

    public void RunDays(List<Person> people, int numberOfDays)
    {
        var stopwatch = Stopwatch.StartNew();
        int yearsPassed = 0;
        Random random = new Random();

        for (int day = 0; day < numberOfDays; day++)
        {
            _currentDate = _currentDate.AddDays(1);

            foreach (var person in people)
            {
                person.AdvanceDay(_currentDate);
            }

            foreach (var person in people)
            {
                if (person.IsAlive && person.Age >= _settings.MortalityStartAge)
                {
                    double deathProbability = CalculateDeathProbability(person.Age);
                    if (random.NextDouble() < deathProbability / 365.0)
                    {
                        person.Die(_currentDate);
                        AnnounceDeath(person);
                    }
                }
            }

            _partnerMatchingService.MatchPartners(people, _currentDate);

            GenerateChildren(people, random);

            _statisticsService.DisplaySummary(people);

            if ((day + 1) % 365 == 0)
            {
                yearsPassed++;
                _logger.Log($"\nYear {yearsPassed} completed - Date: {_currentDate:yyyy-MM-dd}", LogLevel.Important);
                _logger.Log("", LogLevel.Important);
            }
        }

        stopwatch.Stop();
        var totalSeconds = stopwatch.Elapsed.TotalSeconds;
        var avgTimePerYear = totalSeconds / yearsPassed;

        _logger.Log("\n═══════════════════════════════════════", LogLevel.Important);
        _logger.Log($"Simulation completed in {totalSeconds:F2} seconds", LogLevel.Important);
        _logger.Log($"Average time per year: {avgTimePerYear:F3} seconds", LogLevel.Important);
        _logger.Log("═══════════════════════════════════════\n", LogLevel.Important);
    }

    private void GenerateChildren(List<Person> people, Random random)
    {
        var processedCouples = new HashSet<(Person, Person)>();

        for (int i = 0; i < people.Count; i++)
        {
            var parent = people[i];

            if (!parent.IsAlive || !parent.HasPartner || !parent.Partner!.IsAlive)
                continue;
            if (parent.Gender == parent.Partner.Gender)
                continue;
            if (parent.RelationshipDuration.TotalDays < 365 * _settings.MinimumRelationshipYearsForChildren)
                continue;
            if (parent.Age >= _settings.MaxAgeForChildren || parent.Partner.Age >= _settings.MaxAgeForChildren)
                continue;
            if (parent.MaxChildren <= 0 || parent.NumberOfChildren >= parent.MaxChildren)
                continue;

            var couple = string.Compare(parent.Name, parent.Partner.Name, StringComparison.Ordinal) < 0
                ? (parent, parent.Partner!)
                : (parent.Partner!, parent);

            if (!processedCouples.Add(couple))
                continue;

            if (parent.LastChildBirthDate.HasValue)
            {
                var daysSinceLastChild = (_currentDate - parent.LastChildBirthDate.Value).TotalDays;
                if (daysSinceLastChild < 365 * _settings.MinimumGapBetweenChildrenMonths / 12.0)
                    continue;
            }

            if (random.NextDouble() < _settings.AnnualConceptionProbability / 365.0)
            {
                var child = _personFactory.CreateChild(parent, parent.Partner!, _currentDate);
                people.Add(child);
                parent.AddChild(child);
                parent.Partner!.AddChild(child);

                _logger.Log($"👶 {child.DisplayName} was born to {parent.DisplayName} and {parent.Partner.DisplayName}!", LogLevel.Normal);
            }
        }
    }

    private void AnnounceDeath(Person person)
    {
        var familyMembers = new List<string>();

        if (person.Parent1 != null && person.Parent1.IsAlive)
            familyMembers.Add(person.Parent1.DisplayName);
        if (person.Parent2 != null && person.Parent2.IsAlive)
            familyMembers.Add(person.Parent2.DisplayName);

        foreach (var child in person.Children)
        {
            if (child.IsAlive)
                familyMembers.Add(child.DisplayName);
        }

        foreach (var sibling in person.Siblings)
        {
            if (sibling.IsAlive)
                familyMembers.Add(sibling.DisplayName);
        }

        if (familyMembers.Count > 0)
        {
            var familyList = string.Join(", ", familyMembers);
            _logger.Log($"💀 {person.DisplayName} (age {person.Age}) passed away. Saying goodbye: {familyList}.", LogLevel.Normal);
        }
        else
        {
            _logger.Log($"💀 {person.DisplayName} (age {person.Age}) passed away.", LogLevel.Normal);
        }
    }

    private double CalculateDeathProbability(int age)
    {
        if (age < _settings.MortalityStartAge) return 0;
        if (age >= _settings.MaximumAge) return 1.0;

        double yearsAfterMortalityStart = age - _settings.MortalityStartAge;
        return Math.Min(1.0, 0.02 * Math.Exp(0.15 * yearsAfterMortalityStart));
    }
}
