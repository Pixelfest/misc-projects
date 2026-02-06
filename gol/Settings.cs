namespace gol;

using gol.Domain.Services;

public class Settings
{
    // Simulation settings
    public int YearsToSimulate { get; set; } = 100;
    public int InitialPopulation { get; set; } = 1000;
    public LogLevel LogLevel { get; set; } = LogLevel.Important;

    // Relationship settings
    public double SameSexCouplePercentage { get; set; } = 0.05;
    public int MaxAgeDifference { get; set; } = 4;

    // Children settings
    public double CoupleWantsChildrenPercentage { get; set; } = 0.75;
    public int MinChildren { get; set; } = 1;
    public int MaxChildren { get; set; } = 4;
    public int MinimumRelationshipYearsForChildren { get; set; } = 3;
    public int MaxAgeForChildren { get; set; } = 40;
    public double MinimumGapBetweenChildrenMonths { get; set; } = 18;
    public double AnnualConceptionProbability { get; set; } = 0.90;

    // Mortality settings
    public int MortalityStartAge { get; set; } = 75;
    public int MaximumAge { get; set; } = 99;
}
