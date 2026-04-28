using Legorama.Common;
using System;

namespace Legorama.Models;

public sealed class PresentationEntry : NotifyObject
{
	private string _entryName = string.Empty;
	private string _question = string.Empty;
	private string _leftImagePath = string.Empty;
	private string _leftRevealText = string.Empty;
	private RevealColor _leftRevealColor = RevealColor.White;
	private string _rightImagePath = string.Empty;
	private string _rightRevealText = string.Empty;
	private RevealColor _rightRevealColor = RevealColor.White;

	public string EntryName
	{
		get => _entryName;
		set => SetField(ref _entryName, value);
	}

	public string Question
	{
		get => _question;
		set => SetField(ref _question, value);
	}

	public string LeftImagePath
	{
		get => _leftImagePath;
		set => SetField(ref _leftImagePath, value);
	}

	public string LeftRevealText
	{
		get => _leftRevealText;
		set => SetField(ref _leftRevealText, value);
	}

	public RevealColor LeftRevealColor
	{
		get => _leftRevealColor;
		set => SetField(ref _leftRevealColor, value);
	}

	public string RightImagePath
	{
		get => _rightImagePath;
		set => SetField(ref _rightImagePath, value);
	}

	public string RightRevealText
	{
		get => _rightRevealText;
		set => SetField(ref _rightRevealText, value);
	}

	public RevealColor RightRevealColor
	{
		get => _rightRevealColor;
		set => SetField(ref _rightRevealColor, value);
	}

	/// <summary>Returns a shallow copy of this entry.</summary>
	public PresentationEntry Clone() => new()
	{
		EntryName = EntryName,
		Question = Question,
		LeftImagePath = LeftImagePath,
		LeftRevealText = LeftRevealText,
		LeftRevealColor = LeftRevealColor,
		RightImagePath = RightImagePath,
		RightRevealText = RightRevealText,
		RightRevealColor = RightRevealColor
	};

	/// <summary>Copies all field values from <paramref name="source"/> into this entry.</summary>
	public void CopyFrom(PresentationEntry source)
	{
		ArgumentNullException.ThrowIfNull(source);

		EntryName = source.EntryName;
		Question = source.Question;
		LeftImagePath = source.LeftImagePath;
		LeftRevealText = source.LeftRevealText;
		LeftRevealColor = source.LeftRevealColor;
		RightImagePath = source.RightImagePath;
		RightRevealText = source.RightRevealText;
		RightRevealColor = source.RightRevealColor;
	}
}
