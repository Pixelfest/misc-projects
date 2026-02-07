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

        int alive = 0;
        int peopleInRelationship = 0;
        int totalChildren = 0;
        int parentsWithChildren = 0;
        var ageGroupCounts = new Dictionary<int, int>();

        for (int i = 0; i < people.Count; i++)
        {
            var person = people[i];

            if (person.IsAlive)
            {
                alive++;

                int ageGroup = (person.Age / 10) * 10;
                if (!ageGroupCounts.ContainsKey(ageGroup))
                    ageGroupCounts[ageGroup] = 0;
                ageGroupCounts[ageGroup]++;
            }

            if (person.HasPartner)
                peopleInRelationship++;

            if (person.NumberOfChildren > 0)
            {
                totalChildren += person.NumberOfChildren;
                parentsWithChildren++;
            }
        }

        int dead = people.Count - alive;
        int couplesWithChildren = parentsWithChildren / 2;
        double averageChildrenPerCouple = couplesWithChildren > 0 ? (double)totalChildren / parentsWithChildren : 0;

        _logger.Log("Population:", LogLevel.Important);
        _logger.Log($"  Total: {people.Count}", LogLevel.Important);
        _logger.Log($"  Alive: {alive} ({(double)alive / people.Count * 100:F1}%)", LogLevel.Important);
        _logger.Log($"  Dead: {dead} ({(double)dead / people.Count * 100:F1}%)", LogLevel.Important);
        _logger.Log("", LogLevel.Important);

        int peopleSingle = people.Count - peopleInRelationship;
        _logger.Log("Relationship status:", LogLevel.Important);
        _logger.Log($"  In a relationship: {peopleInRelationship} ({(double)peopleInRelationship / people.Count * 100:F1}%)", LogLevel.Important);
        _logger.Log($"  Single: {peopleSingle} ({(double)peopleSingle / people.Count * 100:F1}%)", LogLevel.Important);
        _logger.Log("", LogLevel.Important);

        _logger.Log("Children statistics:", LogLevel.Important);
        _logger.Log($"  Total children born: {totalChildren / 2}", LogLevel.Important);
        _logger.Log($"  Couples with children: {couplesWithChildren}", LogLevel.Important);
        _logger.Log($"  Average children per couple: {averageChildrenPerCouple:F1}", LogLevel.Important);
        _logger.Log("", LogLevel.Important);

        _logger.Log("Living people per age group:", LogLevel.Important);
        var sortedAgeGroups = ageGroupCounts.OrderBy(kvp => kvp.Key);
        foreach (var ageGroup in sortedAgeGroups)
        {
            int rangeStart = ageGroup.Key;
            int rangeEnd = rangeStart + 9;
            _logger.Log($"  {rangeStart}-{rangeEnd}: {ageGroup.Value}", LogLevel.Important);
        }
    }
}
