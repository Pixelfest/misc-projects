namespace gol.Domain.Services;

public enum LogLevel
{
    None = 0,
    Critical = 1,
    Important = 2,
    Normal = 3,
    Detailed = 4,
    Verbose = 5
}

public interface ILogger
{
    void Log(string message, LogLevel level = LogLevel.Normal);
    void SetLogLevel(LogLevel level);
}
