namespace gol.Infrastructure.Services;

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
        int yearsPassed = 0;
        Random random = new Random();

        for (int day = 0; day < numberOfDays; day++)
        {
            _currentDate = _currentDate.AddDays(1);

            // Age everyone by advancing the date
            foreach (var person in people)
            {
                person.AdvanceDay(_currentDate);
            }

            // Process mortality for people at mortality start age+
            foreach (var person in people.Where(p => p.IsAlive && p.Age >= _settings.MortalityStartAge))
            {
                double deathProbability = CalculateDeathProbability(person.Age);
                if (random.NextDouble() < deathProbability / 365.0) // Daily probability
                {
                    person.Die(_currentDate);
                    AnnounceDeath(person);
                }
            }

            // Match partners for those who are eligible
            _partnerMatchingService.MatchPartners(people, _currentDate);

            // Generate children for eligible couples
            GenerateChildren(people, random);

            // Show update every 365 days (1 year)
            if ((day + 1) % 365 == 0)
            {
                yearsPassed++;
                _logger.Log($"\nYear {yearsPassed} completed - Date: {_currentDate:yyyy-MM-dd}", LogLevel.Important);

                // Debug: Show eligible couples for children
                var eligibleForChildren = people.Count(p => p.IsAlive
                    && p.HasPartner
                    && p.Partner!.IsAlive
                    && p.Gender != p.Partner.Gender
                    && p.RelationshipDuration.TotalDays >= 365 * _settings.MinimumRelationshipYearsForChildren
                    && p.Age < _settings.MaxAgeForChildren
                    && p.Partner.Age < _settings.MaxAgeForChildren
                    && p.MaxChildren > 0
                    && p.NumberOfChildren < p.MaxChildren);
                _logger.Log($"DEBUG: {eligibleForChildren / 2} couples eligible for children this year", LogLevel.Detailed);

                _statisticsService.DisplaySummary(people);
                _logger.Log("", LogLevel.Important);
            }
        }
    }

    private void GenerateChildren(List<Person> people, Random random)
    {
        // Find eligible couples
        var eligibleParents = people
            .Where(p => p.IsAlive
                && p.HasPartner
                && p.Partner!.IsAlive
                && p.Gender != p.Partner.Gender
                && p.RelationshipDuration.TotalDays >= 365 * _settings.MinimumRelationshipYearsForChildren
                && p.Age < _settings.MaxAgeForChildren
                && p.Partner.Age < _settings.MaxAgeForChildren
                && p.MaxChildren > 0
                && p.NumberOfChildren < p.MaxChildren)
            .ToList();

        var processedCouples = new HashSet<(Person, Person)>();

        foreach (var parent in eligibleParents)
        {
            // Skip if we already processed this couple
            var couple = parent.GetHashCode() < parent.Partner!.GetHashCode()
                ? (parent, parent.Partner!)
                : (parent.Partner!, parent);

            if (!processedCouples.Add(couple))
                continue;

            // Check minimum gap since last child
            if (parent.LastChildBirthDate.HasValue)
            {
                var daysSinceLastChild = (_currentDate - parent.LastChildBirthDate.Value).TotalDays;
                if (daysSinceLastChild < 365 * _settings.MinimumGapBetweenChildrenMonths / 12.0)
                    continue;
            }

            // Daily probability of conception
            if (random.NextDouble() < _settings.AnnualConceptionProbability / 365.0)
            {
                var child = _personFactory.CreateChild(parent, parent.Partner!, _currentDate);
                people.Add(child);
                parent.AddChild(child);
                parent.Partner!.AddChild(child);

                // Announce the birth
                _logger.Log($"👶 {child.DisplayName} was born to {parent.DisplayName} and {parent.Partner.DisplayName}!", LogLevel.Normal);
            }
        }
    }

    private void AnnounceDeath(Person person)
    {
        var familyMembers = new List<string>();

        // Add parents if alive
        if (person.Parent1 != null && person.Parent1.IsAlive)
            familyMembers.Add(person.Parent1.DisplayName);
        if (person.Parent2 != null && person.Parent2.IsAlive)
            familyMembers.Add(person.Parent2.DisplayName);

        // Add children if alive
        var aliveChildren = person.Children.Where(c => c.IsAlive).ToList();
        familyMembers.AddRange(aliveChildren.Select(c => c.DisplayName));

        // Add siblings if alive
        var aliveSiblings = person.Siblings.Where(s => s.IsAlive).ToList();
        familyMembers.AddRange(aliveSiblings.Select(s => s.DisplayName));

        if (familyMembers.Any())
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
        // Exponential growth formula ensuring no one reaches maximum age
        if (age < _settings.MortalityStartAge) return 0;
        if (age >= _settings.MaximumAge) return 1.0;

        // Exponential formula: death_rate = 0.02 * e^(0.15 * (age - mortalityStartAge))
        double yearsAfterMortalityStart = age - _settings.MortalityStartAge;
        return Math.Min(1.0, 0.02 * Math.Exp(0.15 * yearsAfterMortalityStart));
    }
}
