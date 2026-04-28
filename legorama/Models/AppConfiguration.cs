using System.Collections.Generic;

namespace Legorama.Models;

public sealed class AppConfiguration
{
	public List<PresentationEntry> Entries { get; set; } = [];
	public string LastImageFolder { get; set; } = string.Empty;
}
