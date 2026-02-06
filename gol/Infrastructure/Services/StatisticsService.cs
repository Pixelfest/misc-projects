namespace gol.Infrastructure.Services;

using gol.Domain.Entities;
using gol.Domain.Services;

public class StatisticsService : IStatisticsService
{
    private readonly ILogger _logger;

    public StatisticsService(ILogger logger)
    {
        _logger = logger;
    }

    public void DisplaySummary(List<Person> people)
    {
        _logger.Log("\n=== SIMULATION SUMMARY ===\n", LogLevel.Important);

        DisplayPopulationStatistics(people);
        _logger.Log("", LogLevel.Important);
        DisplayPeoplePerLocation(people);
        _logger.Log("", LogLevel.Important);
        DisplayRelationshipStatistics(people);
        _logger.Log("", LogLevel.Important);
        DisplayChildrenStatistics(people);
        _logger.Log("", LogLevel.Important);
        DisplayAgeGroupStatistics(people);
    }

    private void DisplayPopulationStatistics(List<Person> people)
    {
        var alive = people.Count(p => p.IsAlive);
        var dead = people.Count - alive;

        _logger.Log("Population:", LogLevel.Important);
        _logger.Log($"  Total: {people.Count}", LogLevel.Important);
        _logger.Log($"  Alive: {alive} ({(double)alive / people.Count * 100:F1}%)", LogLevel.Important);
        _logger.Log($"  Dead: {dead} ({(double)dead / people.Count * 100:F1}%)", LogLevel.Important);
    }

    private void DisplayPeoplePerLocation(List<Person> people)
    {
        _logger.Log("Living people per location:", LogLevel.Important);
        var locationGroups = people.Where(p => p.IsAlive)
                                   .GroupBy(p => p.Location)
                                   .OrderByDescending(g => g.Count());

        foreach (var group in locationGroups)
        {
            _logger.Log($"  {group.Key}: {group.Count()}", LogLevel.Important);
        }
    }

    private void DisplayRelationshipStatistics(List<Person> people)
    {
        var peopleInRelationship = people.Count(p => p.HasPartner);
        var peopleSingle = people.Count - peopleInRelationship;

        _logger.Log("Relationship status:", LogLevel.Important);
        _logger.Log($"  In a relationship: {peopleInRelationship} ({(double)peopleInRelationship / people.Count * 100:F1}%)", LogLevel.Important);
        _logger.Log($"  Single: {peopleSingle} ({(double)peopleSingle / people.Count * 100:F1}%)", LogLevel.Important);
    }

    private void DisplayChildrenStatistics(List<Person> people)
    {
        var totalChildren = people.Sum(p => p.NumberOfChildren);
        var parentsWithChildren = people.Count(p => p.NumberOfChildren > 0);
        var couplesWithChildren = parentsWithChildren / 2; // Divide by 2 since both parents are counted
        var averageChildrenPerCouple = couplesWithChildren > 0
            ? (double)totalChildren / parentsWithChildren // totalChildren counts each child twice (once per parent), parentsWithChildren counts both parents
            : 0;

        _logger.Log("Children statistics:", LogLevel.Important);
        _logger.Log($"  Total children born: {totalChildren / 2}", LogLevel.Important); // Divide by 2 since both parents track the same child
        _logger.Log($"  Couples with children: {couplesWithChildren}", LogLevel.Important);
        _logger.Log($"  Average children per couple: {averageChildrenPerCouple:F1}", LogLevel.Important);
    }

    private void DisplayAgeGroupStatistics(List<Person> people)
    {
        _logger.Log("Living people per age group:", LogLevel.Important);
        var ageGroups = people.Where(p => p.IsAlive)
                             .GroupBy(p => (p.Age / 10) * 10)
                             .OrderBy(g => g.Key);

        foreach (var group in ageGroups)
        {
            var rangeStart = group.Key;
            var rangeEnd = rangeStart + 9;
            _logger.Log($"  {rangeStart}-{rangeEnd}: {group.Count()}", LogLevel.Important);
        }
    }
}
