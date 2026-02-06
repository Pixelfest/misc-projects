namespace gol.Domain.Entities;

public class Person
{
    private DateTime _currentDate;

    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string Name => $"{FirstName} {LastName}";
    public string DisplayName => HasPartner && Partner!.LastName != LastName
        ? $"{FirstName} {LastName} ({Partner.LastName})"
        : Name;
    public DateTime BirthDate { get; private set; }
    public string Location { get; private set; }
    public string Gender { get; private set; }
    public IReadOnlyList<string> Licenses { get; private set; }
    public string EducationLevel { get; private set; }
    public IReadOnlyList<string> Hobbies { get; private set; }
    public Person? Partner { get; private set; }
    public DateTime? RelationshipStartDate { get; private set; }
    public bool IsAlive { get; private set; }
    public DateTime? DateOfDeath { get; private set; }
    public int MaxChildren { get; private set; }
    private List<Person> _children = new List<Person>();
    public IReadOnlyList<Person> Children => _children.AsReadOnly();
    public int NumberOfChildren => _children.Count;
    public DateTime? LastChildBirthDate => _children.Count > 0 ? _children[_children.Count - 1].BirthDate : null;
    public Person? Parent1 { get; private set; }
    public Person? Parent2 { get; private set; }
    public bool HasParents => Parent1 != null && Parent2 != null;

    public IReadOnlyList<Person> Siblings
    {
        get
        {
            if (!HasParents) return new List<Person>().AsReadOnly();

            var siblings = new List<Person>();
            if (Parent1 != null)
            {
                siblings.AddRange(Parent1.Children.Where(c => c != this));
            }
            return siblings.Distinct().ToList().AsReadOnly();
        }
    }

    public int Age => _currentDate.Year - BirthDate.Year - (_currentDate.DayOfYear < BirthDate.DayOfYear ? 1 : 0);
    public bool HasPartner => Partner != null;
    public bool IsLookingForPartner => Age >= 18 && !HasPartner && IsAlive;
    public TimeSpan RelationshipDuration => HasPartner && RelationshipStartDate.HasValue
        ? _currentDate - RelationshipStartDate.Value
        : TimeSpan.Zero;

    public Person(string firstName, string lastName, DateTime birthDate, string location, string gender,
                  List<string> licenses, string educationLevel, List<string> hobbies)
    {
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        BirthDate = birthDate;
        Location = location ?? throw new ArgumentNullException(nameof(location));
        Gender = gender ?? throw new ArgumentNullException(nameof(gender));
        Licenses = licenses?.AsReadOnly() ?? new List<string>().AsReadOnly();
        EducationLevel = educationLevel ?? throw new ArgumentNullException(nameof(educationLevel));
        Hobbies = hobbies?.AsReadOnly() ?? new List<string>().AsReadOnly();
        _currentDate = birthDate; // Initialize to birth date, will be updated as simulation progresses
        IsAlive = true;
        DateOfDeath = null;
        MaxChildren = 0; // Will be set when entering a relationship
    }

    public void AdvanceDay(DateTime newDate)
    {
        _currentDate = newDate;
    }

    public void SetPartner(Person partner, DateTime relationshipStartDate)
    {
        if (partner == null)
            throw new ArgumentNullException(nameof(partner));

        if (HasPartner && Partner != partner)
            throw new InvalidOperationException($"{Name} already has a partner.");

        if (partner.HasPartner && partner.Partner != this)
            throw new InvalidOperationException($"{partner.Name} already has a partner.");

        Partner = partner;
        RelationshipStartDate = relationshipStartDate;
    }

    public void SetMaxChildren(int maxChildren)
    {
        MaxChildren = maxChildren;
    }

    public void AddChild(Person child)
    {
        _children.Add(child);
    }

    public void SetParents(Person parent1, Person parent2)
    {
        Parent1 = parent1;
        Parent2 = parent2;
    }

    public bool IsCompatibleWith(Person other, int maxAgeDifference = 4)
    {
        if (other == null) return false;
        if (!IsLookingForPartner || !other.IsLookingForPartner) return false;

        var ageDifference = Math.Abs(Age - other.Age);
        return ageDifference <= maxAgeDifference;
    }

    public void Die(DateTime dateOfDeath)
    {
        IsAlive = false;
        DateOfDeath = dateOfDeath;
    }
}
