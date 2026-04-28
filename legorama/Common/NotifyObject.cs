using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace Legorama.Common;

public abstract class NotifyObject : INotifyPropertyChanged
{
	public event PropertyChangedEventHandler? PropertyChanged;

	protected bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
	{
		if (Equals(field, value))
		{
			return false;
		}

		field = value;
		PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
		return true;
	}
}
