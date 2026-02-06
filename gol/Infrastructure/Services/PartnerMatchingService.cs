namespace gol.Infrastructure.Services;

using gol.Domain.Entities;
using gol.Domain.Services;

public class PartnerMatchingService : IPartnerMatchingService
{
    private static readonly Random _random = new Random();
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
        
        // Shuffle for randomness
        var shuffled = eligiblePeople.OrderBy(x => _random.Next()).ToList();
        
        // Calculate how many same-sex couples we want
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

            // Decide if this should be a same-sex couple
            var shouldBeSameSex = sameSexCouplesCreated < sameSexCouplesTarget && _random.NextDouble() < 0.3;
            
            // Find compatible partner
            Person? partner = null;
            
            if (shouldBeSameSex)
            {
                partner = FindCompatiblePartner(person, shuffled, sameGenderOnly: true);
                if (partner != null)
                {
                    sameSexCouplesCreated++;
                }
            }
            
            // If no same-sex partner found or we want mixed-sex couple
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
        var eligibleCandidates = candidates
            .Where(c => c != person && c.IsLookingForPartner && c.IsCompatibleWith(person, _settings.MaxAgeDifference))
            .ToList();

        if (sameGenderOnly)
        {
            eligibleCandidates = eligibleCandidates
                .Where(c => c.Gender == person.Gender)
                .ToList();
        }
        else
        {
            eligibleCandidates = eligibleCandidates
                .Where(c => c.Gender != person.Gender)
                .ToList();
        }

        return eligibleCandidates.FirstOrDefault();
    }

    private void CreatePartnership(Person person1, Person person2)
    {
        person1.SetPartner(person2, _currentDate);
        person2.SetPartner(person1, _currentDate);

        // Announce the relationship
        var relationshipType = person1.Gender == person2.Gender ? "same-sex" : "mixed-sex";
        _logger.Log($"💑 {person1.DisplayName} and {person2.DisplayName} entered a {relationshipType} relationship.", LogLevel.Normal);

        // Determine if they want children and how many (only for mixed-sex couples)
        if (person1.Gender != person2.Gender)
        {
            if (_random.NextDouble() < _settings.CoupleWantsChildrenPercentage)
            {
                var maxChildren = _random.Next(_settings.MinChildren, _settings.MaxChildren + 1);
                person1.SetMaxChildren(maxChildren);
                person2.SetMaxChildren(maxChildren);
            }
        }
    }
}
