namespace gol.Domain.Services;

using gol.Domain.Entities;

public interface IStatisticsService
{
    void DisplaySummary(List<Person> people);
}
