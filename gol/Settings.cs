namespace gol;

using gol.Domain.Services;

public class Settings
{
    public int YearsToSimulate { get; set; } = 1000;
    public int InitialPopulation { get; set; } = 10000;
    public LogLevel LogLevel { get; set; } = LogLevel.Important;

    public double SameSexCouplePercentage { get; set; } = 0.05;
    public int MaxAgeDifference { get; set; } = 4;

    public double CoupleWantsChildrenPercentage { get; set; } = 0.75;
    public int MinChildren { get; set; } = 1;
    public int MaxChildren { get; set; } = 4;
    public int MinimumRelationshipYearsForChildren { get; set; } = 3;
    public int MaxAgeForChildren { get; set; } = 40;
    public double MinimumGapBetweenChildrenMonths { get; set; } = 18;
    public double AnnualConceptionProbability { get; set; } = 0.90;

    public int MortalityStartAge { get; set; } = 75;
    public int MaximumAge { get; set; } = 99;
}
