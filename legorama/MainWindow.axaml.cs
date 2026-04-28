using System;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Media;
using Avalonia.Media.Imaging;
using Avalonia.Platform.Storage;
using Avalonia.Threading;
using Legorama.Helpers;
using Legorama.Models;
using Legorama.Services;

namespace Legorama;

public partial class MainWindow : Window, INotifyPropertyChanged
{
	private readonly DispatcherTimer _saveFeedbackTimer;
	private readonly Random _random = new();
	private bool _isSetupMode = true;
	private bool _isRevealVisible;
	private bool _isLoading;
	private bool _isEditingEntry;
	private bool _isPresentationStarted;
	private int _currentPresentationIndex;
	private PresentationEntry? _selectedEntry;
	private PresentationEntry? _editingEntry;
	private Bitmap? _currentLeftImage;
	private Bitmap? _currentRightImage;
	private Bitmap? _editingLeftImage;
	private Bitmap? _editingRightImage;
	private string _lastImageFolder = string.Empty;
	private string _saveFeedbackMessage = string.Empty;
	private bool _isSaveFeedbackVisible;
	private bool _isSidesSwapped;

	public MainWindow()
	{
		InitializeComponent();
		DataContext = this;

		_saveFeedbackTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1.2) };
		_saveFeedbackTimer.Tick += OnSaveFeedbackTimerTick;

		Entries.CollectionChanged += OnEntriesCollectionChanged;
		Opened += (_, _) => LoadConfiguration();
	}

	public event PropertyChangedEventHandler? PropertyChanged;

	public ObservableCollection<PresentationEntry> Entries { get; } = [];

	public Array RevealColors { get; } = Enum.GetValues<RevealColor>();

	public bool IsSetupMode
	{
		get => _isSetupMode;
		set
		{
			if (SetField(ref _isSetupMode, value))
			{
				OnPropertyChanged(nameof(IsPresentationMode));
			}
		}
	}

	public bool IsPresentationMode => !IsSetupMode;

	public bool HasSelectedEntry => SelectedEntry is not null;

	public bool HasEntries => Entries.Count > 0;

	public bool IsEditingEntry
	{
		get => _isEditingEntry;
		private set
		{
			if (SetField(ref _isEditingEntry, value))
			{
				OnPropertyChanged(nameof(IsNotEditingEntry));
				OnPropertyChanged(nameof(CanStartEdit));
			}
		}
	}

	public bool IsNotEditingEntry => !IsEditingEntry;

	public bool CanStartEdit => HasSelectedEntry && !IsEditingEntry;

	public PresentationEntry? SelectedEntry
	{
		get => _selectedEntry;
		set
		{
			if (SetField(ref _selectedEntry, value))
			{
				OnPropertyChanged(nameof(HasSelectedEntry));
				OnPropertyChanged(nameof(CanStartEdit));
				if (IsEditingEntry)
				{
					if (_selectedEntry is null)
					{
						CancelEdit();
					}
					else
					{
						EditingEntry = _selectedEntry.Clone();
					}
				}
			}
		}
	}

	public PresentationEntry? EditingEntry
	{
		get => _editingEntry;
		private set
		{
			if (_editingEntry is not null)
			{
				_editingEntry.PropertyChanged -= OnEditingEntryPropertyChanged;
			}

			if (SetField(ref _editingEntry, value))
			{
				if (_editingEntry is not null)
				{
					_editingEntry.PropertyChanged += OnEditingEntryPropertyChanged;
				}
				RefreshEditingPreviewBindings();
			}
		}
	}

	private PresentationEntry? CurrentPresentationEntry => Entries.Count == 0 ? null : Entries[_currentPresentationIndex];

	private string CurrentLeftSideRevealText => _isSidesSwapped
		? CurrentPresentationEntry?.RightRevealText ?? string.Empty
		: CurrentPresentationEntry?.LeftRevealText ?? string.Empty;

	private string CurrentRightSideRevealText => _isSidesSwapped
		? CurrentPresentationEntry?.LeftRevealText ?? string.Empty
		: CurrentPresentationEntry?.RightRevealText ?? string.Empty;

	private RevealColor CurrentLeftSideRevealColor => _isSidesSwapped
		? CurrentPresentationEntry?.RightRevealColor ?? RevealColor.White
		: CurrentPresentationEntry?.LeftRevealColor ?? RevealColor.White;

	private RevealColor CurrentRightSideRevealColor => _isSidesSwapped
		? CurrentPresentationEntry?.LeftRevealColor ?? RevealColor.White
		: CurrentPresentationEntry?.RightRevealColor ?? RevealColor.White;

	public string CurrentQuestion => CurrentPresentationEntry?.Question ?? string.Empty;

	public string CurrentLeftRevealText => _isRevealVisible ? CurrentLeftSideRevealText : string.Empty;

	public string CurrentRightRevealText => _isRevealVisible ? CurrentRightSideRevealText : string.Empty;

	public IBrush CurrentLeftRevealBrush => BitmapHelper.GetBrush(CurrentLeftSideRevealColor);

	public IBrush CurrentRightRevealBrush => BitmapHelper.GetBrush(CurrentRightSideRevealColor);

	public Bitmap? CurrentLeftImage => _currentLeftImage;

	public Bitmap? CurrentRightImage => _currentRightImage;

	public Bitmap? EditingLeftImage => _editingLeftImage;

	public Bitmap? EditingRightImage => _editingRightImage;

	public string SaveFeedbackMessage
	{
		get => _saveFeedbackMessage;
		private set => SetField(ref _saveFeedbackMessage, value);
	}

	public bool IsSaveFeedbackVisible
	{
		get => _isSaveFeedbackVisible;
		private set => SetField(ref _isSaveFeedbackVisible, value);
	}

	private void LoadConfiguration()
	{
		_isLoading = true;
		try
		{
			var configuration = ConfigurationService.Load();
			Entries.Clear();
			_lastImageFolder = configuration.LastImageFolder;
			foreach (var entry in configuration.Entries)
			{
				Entries.Add(entry);
			}
		}
		finally
		{
			_isLoading = false;
		}

		if (Entries.Count == 0)
		{
			AddEntry();
			SaveConfiguration();
		}
		else
		{
			SelectedEntry = Entries[0];
			_currentPresentationIndex = 0;
			RefreshPresentationBindings();
		}
	}

	private void SaveConfiguration()
	{
		var configuration = new AppConfiguration
		{
			Entries = [.. Entries],
			LastImageFolder = _lastImageFolder
		};
		ConfigurationService.Save(configuration);
	}

	private void OnEntriesCollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
	{
		if (_currentPresentationIndex >= Entries.Count)
		{
			_currentPresentationIndex = Math.Max(0, Entries.Count - 1);
		}

		OnPropertyChanged(nameof(HasEntries));
		RefreshPresentationBindings();
	}

	private void AddEntry_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		AddEntry();
		SaveConfiguration();
	}

	private void AddEntry()
	{
		var entry = new PresentationEntry
		{
			EntryName = $"Entry {Entries.Count + 1}",
			LeftRevealColor = RevealColor.White,
			RightRevealColor = RevealColor.White
		};

		Entries.Add(entry);
		SelectedEntry = entry;
	}

	private void DeleteEntry_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		if (SelectedEntry is null)
		{
			return;
		}

		var index = Entries.IndexOf(SelectedEntry);
		Entries.Remove(SelectedEntry);

		if (Entries.Count == 0)
		{
			SelectedEntry = null;
			SaveConfiguration();
			return;
		}

		SelectedEntry = Entries[Math.Clamp(index, 0, Entries.Count - 1)];
		SaveConfiguration();
	}

	private void MoveUp_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		if (SelectedEntry is null)
		{
			return;
		}

		var index = Entries.IndexOf(SelectedEntry);
		if (index <= 0)
		{
			return;
		}

		Entries.Move(index, index - 1);
		SaveConfiguration();
	}

	private void MoveDown_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		if (SelectedEntry is null)
		{
			return;
		}

		var index = Entries.IndexOf(SelectedEntry);
		if (index < 0 || index >= Entries.Count - 1)
		{
			return;
		}

		Entries.Move(index, index + 1);
		SaveConfiguration();
	}

	private void BeginEditEntry_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		if (SelectedEntry is null)
		{
			return;
		}

		EditingEntry = SelectedEntry.Clone();
		IsEditingEntry = true;
	}

	private void SaveEntry_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		TrySaveEditingEntry();
	}

	private bool TrySaveEditingEntry()
	{
		if (SelectedEntry is null || EditingEntry is null)
		{
			return false;
		}

		SelectedEntry.CopyFrom(EditingEntry);
		EditingEntry = SelectedEntry.Clone();
		RefreshPresentationBindings();
		SaveConfiguration();
		ShowSaveFeedback("Saved");
		return true;
	}

	private void CancelEdit_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		CancelEdit();
	}

	private void CancelEdit()
	{
		EditingEntry = null;
		IsEditingEntry = false;
		HideSaveFeedback();
	}

	private async void BrowseLeftImage_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		if (EditingEntry is null)
		{
			return;
		}

		var path = await PickImagePathAsync();
		if (!string.IsNullOrWhiteSpace(path))
		{
			EditingEntry.LeftImagePath = path;
		}
	}

	private async void BrowseRightImage_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		if (EditingEntry is null)
		{
			return;
		}

		var path = await PickImagePathAsync();
		if (!string.IsNullOrWhiteSpace(path))
		{
			EditingEntry.RightImagePath = path;
		}
	}

	private void StartPresentation_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		if (Entries.Count == 0)
		{
			return;
		}

		CancelEdit();
		_currentPresentationIndex = 0;
		_isRevealVisible = false;
		_isPresentationStarted = true;
		RandomizePresentationSides();
		IsSetupMode = false;
		WindowState = WindowState.Maximized;
		RefreshPresentationBindings();
	}

	private void ReturnToSetup_Click(object? sender, Avalonia.Interactivity.RoutedEventArgs e)
	{
		_isRevealVisible = false;
		_isPresentationStarted = false;
		IsSetupMode = true;
	}

	private void OnMainWindowKeyDown(object? sender, KeyEventArgs e)
	{
		if (IsSetupMode)
		{
			HandleSetupKeyDown(e);
			return;
		}

		if (Entries.Count == 0)
		{
			return;
		}

		switch (e.Key)
		{
			case Key.R:
				if (!_isPresentationStarted)
				{
					e.Handled = true;
					break;
				}

				_isRevealVisible = true;
				RefreshPresentationBindings();
				e.Handled = true;
				break;
			case Key.Space:
			case Key.Right:
				_isPresentationStarted = true;
				MoveSlide(1);
				e.Handled = true;
				break;
			case Key.Left:
				_isPresentationStarted = true;
				MoveSlide(-1);
				e.Handled = true;
				break;
			case Key.Escape:
				ReturnToSetup_Click(this, new Avalonia.Interactivity.RoutedEventArgs());
				e.Handled = true;
				break;
		}
	}

	private void HandleSetupKeyDown(KeyEventArgs e)
	{
		if (e.KeyModifiers.HasFlag(KeyModifiers.Control) && e.Key == Key.S)
		{
			if (TrySaveEditingEntry())
			{
				e.Handled = true;
			}

			return;
		}

		if (Entries.Count == 0 || e.Source is TextBox or ComboBox)
		{
			return;
		}

		switch (e.Key)
		{
			case Key.Up:
				SelectRelativeEntry(-1);
				e.Handled = true;
				break;
			case Key.Down:
				SelectRelativeEntry(1);
				e.Handled = true;
				break;
		}
	}

	private void SelectRelativeEntry(int delta)
	{
		if (Entries.Count == 0)
		{
			return;
		}

		var currentIndex = SelectedEntry is null ? 0 : Entries.IndexOf(SelectedEntry);
		if (currentIndex < 0)
		{
			currentIndex = 0;
		}

		var nextIndex = (currentIndex + delta + Entries.Count) % Entries.Count;
		SelectedEntry = Entries[nextIndex];
	}

	private async System.Threading.Tasks.Task<string?> PickImagePathAsync()
	{
		IStorageFolder? suggestedFolder = null;
		if (!string.IsNullOrWhiteSpace(_lastImageFolder) && Directory.Exists(_lastImageFolder))
		{
			suggestedFolder = await StorageProvider.TryGetFolderFromPathAsync(_lastImageFolder);
		}

		var files = await StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
		{
			AllowMultiple = false,
			Title = "Choose image",
			SuggestedStartLocation = suggestedFolder,
			FileTypeFilter =
			[
				new FilePickerFileType("Images")
				{
					Patterns = ["*.png", "*.jpg", "*.jpeg", "*.bmp", "*.webp"]
				}
			]
		});

		if (files.Count == 0)
		{
			return null;
		}

		var selectedPath = files[0].TryGetLocalPath();
		if (string.IsNullOrWhiteSpace(selectedPath))
		{
			return null;
		}

		var selectedFolder = Path.GetDirectoryName(selectedPath);
		if (!string.IsNullOrWhiteSpace(selectedFolder) && !string.Equals(selectedFolder, _lastImageFolder, StringComparison.OrdinalIgnoreCase))
		{
			_lastImageFolder = selectedFolder;
			SaveConfiguration();
		}

		return selectedPath;
	}

	private void MoveSlide(int delta)
	{
		if (Entries.Count == 0)
		{
			return;
		}

		_currentPresentationIndex = (_currentPresentationIndex + delta + Entries.Count) % Entries.Count;
		_isRevealVisible = false;
		RandomizePresentationSides();
		RefreshPresentationBindings();
	}

	private void RefreshPresentationBindings()
	{
		LoadCurrentImages();
		OnPropertyChanged(nameof(CurrentQuestion));
		OnPropertyChanged(nameof(CurrentLeftRevealText));
		OnPropertyChanged(nameof(CurrentRightRevealText));
		OnPropertyChanged(nameof(CurrentLeftRevealBrush));
		OnPropertyChanged(nameof(CurrentRightRevealBrush));
	}

	private void RandomizePresentationSides()
	{
		_isSidesSwapped = _random.Next(2) == 0;
	}

	private void LoadCurrentImages()
	{
		_currentLeftImage?.Dispose();
		_currentRightImage?.Dispose();
		var leftPath = _isSidesSwapped
			? CurrentPresentationEntry?.RightImagePath
			: CurrentPresentationEntry?.LeftImagePath;
		var rightPath = _isSidesSwapped
			? CurrentPresentationEntry?.LeftImagePath
			: CurrentPresentationEntry?.RightImagePath;
		_currentLeftImage = BitmapHelper.LoadBitmap(leftPath);
		_currentRightImage = BitmapHelper.LoadBitmap(rightPath);
		OnPropertyChanged(nameof(CurrentLeftImage));
		OnPropertyChanged(nameof(CurrentRightImage));
	}

	private void OnEditingEntryPropertyChanged(object? sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName is nameof(PresentationEntry.LeftImagePath) or nameof(PresentationEntry.RightImagePath))
		{
			RefreshEditingPreviewBindings();
		}
	}

	private void RefreshEditingPreviewBindings()
	{
		_editingLeftImage?.Dispose();
		_editingRightImage?.Dispose();
		_editingLeftImage = BitmapHelper.LoadBitmap(EditingEntry?.LeftImagePath);
		_editingRightImage = BitmapHelper.LoadBitmap(EditingEntry?.RightImagePath);
		OnPropertyChanged(nameof(EditingLeftImage));
		OnPropertyChanged(nameof(EditingRightImage));
	}

	private bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
	{
		if (Equals(field, value))
		{
			return false;
		}

		field = value;
		OnPropertyChanged(propertyName);
		return true;
	}

	private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
	{
		PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
	}

	private void OnSaveFeedbackTimerTick(object? sender, EventArgs e)
	{
		_saveFeedbackTimer.Stop();
		HideSaveFeedback();
	}

	private void ShowSaveFeedback(string message)
	{
		SaveFeedbackMessage = message;
		IsSaveFeedbackVisible = true;
		_saveFeedbackTimer.Stop();
		_saveFeedbackTimer.Start();
	}

	private void HideSaveFeedback()
	{
		SaveFeedbackMessage = string.Empty;
		IsSaveFeedbackVisible = false;
	}
}