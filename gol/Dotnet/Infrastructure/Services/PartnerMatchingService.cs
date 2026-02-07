namespace gol.Infrastructure.Services;

using gol.Domain.Entities;
using gol.Domain.Services;

public class PartnerMatchingService : IPartnerMatchingService
{
    private static readonly Random Random = new();
    private readonly Settings _settings;
    private readonly ILogger _logger;
    private DateTime _currentDate;

    public PartnerMatchingService(Settings settings, ILogger logger)
    {
        _settings = settings;
        _logger = logger;
        _currentDate = DateTime.Now.Date;
    }

    public void MatchPartners(List<Person> people, DateTime currentDate)
    {
        _currentDate = currentDate;
        var eligiblePeople = people.Where(p => p.IsLookingForPartner).ToList();

        var shuffled = eligiblePeople;
        for (int i = shuffled.Count - 1; i > 0; i--)
        {
            int j = Random.Next(i + 1);
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
        }

        var totalCouples = shuffled.Count / 2;
        var sameSexCouplesTarget = (int)(totalCouples * _settings.SameSexCouplePercentage);
        var sameSexCouplesCreated = 0;

        var index = 0;
        while (index < shuffled.Count && shuffled.Any(p => p.IsLookingForPartner))
        {
            var person = shuffled[index];
            
            if (!person.IsLookingForPartner)
            {
                index++;
                continue;
            }

            var shouldBeSameSex = sameSexCouplesCreated < sameSexCouplesTarget && Random.NextDouble() < 0.3;

            Person? partner = null;
            
            if (shouldBeSameSex)
            {
                partner = FindCompatiblePartner(person, shuffled, sameGenderOnly: true);
                if (partner != null)
                {
                    sameSexCouplesCreated++;
                }
            }

            if (partner == null)
            {
                partner = FindCompatiblePartner(person, shuffled, sameGenderOnly: false);
            }

            if (partner != null && !partner.HasPartner)
            {
                CreatePartnership(person, partner);
            }

            index++;
        }
    }

    private Person? FindCompatiblePartner(Person person, List<Person> candidates, bool sameGenderOnly)
    {
        for (int i = 0; i < candidates.Count; i++)
        {
            var candidate = candidates[i];

            if (candidate == person || !candidate.IsLookingForPartner)
                continue;

            if (!candidate.IsCompatibleWith(person, _settings.MaxAgeDifference))
                continue;

            if (sameGenderOnly && candidate.Gender != person.Gender)
                continue;

            if (!sameGenderOnly && candidate.Gender == person.Gender)
                continue;

            return candidate;
        }

        return null;
    }

    private void CreatePartnership(Person person1, Person person2)
    {
        person1.SetPartner(person2, _currentDate);
        person2.SetPartner(person1, _currentDate);

        var relationshipType = person1.Gender == person2.Gender ? "same-sex" : "mixed-sex";
        _logger.Log($"💑 {person1.DisplayName} and {person2.DisplayName} entered a {relationshipType} relationship.", LogLevel.Normal);

        if (person1.Gender != person2.Gender)
        {
            if (Random.NextDouble() < _settings.CoupleWantsChildrenPercentage)
            {
                var maxChildren = Random.Next(_settings.MinChildren, _settings.MaxChildren + 1);
                person1.SetMaxChildren(maxChildren);
                person2.SetMaxChildren(maxChildren);
            }
        }
    }
}
