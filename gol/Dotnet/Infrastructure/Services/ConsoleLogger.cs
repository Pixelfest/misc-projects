namespace gol.Infrastructure.Services;

using gol.Domain.Services;

public class ConsoleLogger : ILogger
{
    private LogLevel _currentLogLevel;

    public ConsoleLogger(LogLevel logLevel = LogLevel.Normal)
    {
        _currentLogLevel = logLevel;
    }

    public void SetLogLevel(LogLevel level)
    {
        _currentLogLevel = level;
    }

    public void Log(string message, LogLevel level = LogLevel.Normal)
    {
        if (level <= _currentLogLevel)
        {
            Console.WriteLine(message);
        }
    }
}
