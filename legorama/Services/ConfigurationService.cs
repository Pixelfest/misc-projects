using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using Legorama.Models;

namespace Legorama.Services;

public static class ConfigurationService
{
	private static readonly JsonSerializerOptions JsonOptions = new()
	{
		WriteIndented = true,
		Converters = { new JsonStringEnumConverter() }
	};

	public static string ConfigurationPath { get; } = Path.Combine(
		Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
		"Legorama",
		"presentation-config.json");

	/// <summary>Loads the application configuration from disk, or returns a default instance if no file exists.</summary>
	public static AppConfiguration Load()
	{
		if (!File.Exists(ConfigurationPath))
		{
			return new AppConfiguration();
		}

		var json = File.ReadAllText(ConfigurationPath);
		return JsonSerializer.Deserialize<AppConfiguration>(json, JsonOptions) ?? new AppConfiguration();
	}

	/// <summary>Persists the application configuration to disk.</summary>
	public static void Save(AppConfiguration configuration)
	{
		ArgumentNullException.ThrowIfNull(configuration);

		Directory.CreateDirectory(Path.GetDirectoryName(ConfigurationPath)!);
		var json = JsonSerializer.Serialize(configuration, JsonOptions);
		File.WriteAllText(ConfigurationPath, json);
	}
}
