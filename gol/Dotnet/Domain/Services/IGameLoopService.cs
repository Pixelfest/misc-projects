namespace gol.Domain.Services;

using gol.Domain.Entities;

public interface IGameLoopService
{
    void RunDays(List<Person> people, int numberOfDays);
}
