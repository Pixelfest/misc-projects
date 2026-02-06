namespace gol.Domain.Entities;

public class Person
{
    private DateTime _currentDate;
    private int _cachedAge;

    private string FirstName { get; }
    public string LastName { get; }
    public string Name => $"{FirstName} {LastName}";
    public string DisplayName => HasPartner && Partner!.LastName != LastName
        ? $"{FirstName} {LastName} ({Partner.LastName})"
        : Name;

    private DateTime BirthDate { get; }
    public string Gender { get; private set; }
    public Person? Partner { get; private set; }
    private DateTime? RelationshipStartDate { get; set; }
    public bool IsAlive { get; private set; }
    public DateTime? DateOfDeath { get; private set; }
    public int MaxChildren { get; private set; }
    private readonly List<Person> _children = [];
    public IReadOnlyList<Person> Children => _children.AsReadOnly();
    public int NumberOfChildren => _children.Count;
    private DateTime? _lastChildBirthDate;
    public DateTime? LastChildBirthDate => _lastChildBirthDate;
    public Person? Parent1 { get; private set; }
    public Person? Parent2 { get; private set; }
    public bool HasParents => Parent1 != null && Parent2 != null;

    private IReadOnlyList<Person>? _cachedSiblings;
    public IReadOnlyList<Person> Siblings
    {
        get
        {
            if (_cachedSiblings != null)
                return _cachedSiblings;

            if (!HasParents)
            {
                _cachedSiblings = [];
                return _cachedSiblings;
            }

            var siblings = new List<Person>();
            if (Parent1 != null)
            {
                foreach (var child in Parent1.Children)
                {
                    if (child != this)
                        siblings.Add(child);
                }
            }
            _cachedSiblings = siblings.AsReadOnly();
            return _cachedSiblings;
        }
    }

    public int Age => _cachedAge;
    public bool HasPartner => Partner != null;
    public bool IsLookingForPartner => Age >= 18 && !HasPartner && IsAlive;
    public TimeSpan RelationshipDuration => HasPartner && RelationshipStartDate.HasValue
        ? _currentDate - RelationshipStartDate.Value
        : TimeSpan.Zero;

    public Person(string firstName, string lastName, DateTime birthDate, string gender, List<string> hobbies)
    {
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        BirthDate = birthDate;
        Gender = gender ?? throw new ArgumentNullException(nameof(gender));
        _currentDate = birthDate;
        _cachedAge = 0;
        IsAlive = true;
        DateOfDeath = null;
        MaxChildren = 0;
    }

    public void AdvanceDay(DateTime newDate)
    {
        _currentDate = newDate;
        _cachedAge = _currentDate.Year - BirthDate.Year - (_currentDate.DayOfYear < BirthDate.DayOfYear ? 1 : 0);
    }

    public void SetPartner(Person partner, DateTime relationshipStartDate)
    {
        if (partner == null)
            throw new ArgumentNullException(nameof(partner));

        if (HasPartner && Partner != partner)
            throw new InvalidOperationException($"{DisplayName} already has a partner.");

        if (partner.HasPartner && partner.Partner != this)
            throw new InvalidOperationException($"{partner.DisplayName} already has a partner.");

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
        _lastChildBirthDate = child.BirthDate;
        _cachedSiblings = null;
    }

    public void SetParents(Person parent1, Person parent2)
    {
        Parent1 = parent1;
        Parent2 = parent2;
    }

    public bool IsCompatibleWith(Person? other, int maxAgeDifference = 4)
    {
        if (other == null)
            return false;

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
