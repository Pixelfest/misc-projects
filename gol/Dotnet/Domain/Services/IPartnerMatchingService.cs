namespace gol.Domain.Services;

using gol.Domain.Entities;

public interface IPartnerMatchingService
{
    void MatchPartners(List<Person> people, DateTime currentDate);
}
