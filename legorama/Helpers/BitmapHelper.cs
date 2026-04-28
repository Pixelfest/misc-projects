using System;
using System.IO;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Legorama.Models;

namespace Legorama.Helpers;

public static class BitmapHelper
{
	/// <summary>Safely loads a <see cref="Bitmap"/> from the given path. Returns <c>null</c> if the path is empty, the file is missing, or the image cannot be decoded.</summary>
	public static Bitmap? LoadBitmap(string? path)
	{
		if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
		{
			return null;
		}

		try
		{
			return new Bitmap(path);
		}
		catch (Exception ex) when (ex is InvalidOperationException or IOException or UnauthorizedAccessException or ArgumentException or NotSupportedException)
		{
			return null;
		}
	}

	/// <summary>Returns the <see cref="IBrush"/> that corresponds to the given <see cref="RevealColor"/>.</summary>
	public static IBrush GetBrush(RevealColor color) => color switch
	{
		RevealColor.Red => Brushes.Red,
		RevealColor.Green => Brushes.LimeGreen,
		_ => Brushes.White
	};
}
