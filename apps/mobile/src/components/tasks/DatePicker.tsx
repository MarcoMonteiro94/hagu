import { Platform, TextInput, StyleSheet } from 'react-native'
import type { ThemeColors } from '@/theme'

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  visible: boolean
  onClose: () => void
  colors: ThemeColors
  placeholder?: string
}

export function DatePicker({
  value,
  onChange,
  visible,
  onClose,
  colors,
  placeholder = 'YYYY-MM-DD',
}: DatePickerProps) {
  if (!visible) return null

  const handleChange = (text: string) => {
    if (!text) {
      onChange(undefined)
      return
    }
    const parsed = new Date(text + 'T00:00:00')
    if (!isNaN(parsed.getTime())) {
      onChange(parsed)
    }
  }

  // Web: use native HTML date input
  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        value={value?.toISOString().split('T')[0] ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={onClose}
        autoFocus
        style={{
          fontSize: 16,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: colors.border,
          backgroundColor: colors.secondary,
          color: colors.foreground,
          width: '100%',
          boxSizing: 'border-box',
          marginTop: 8,
        }}
      />
    )
  }

  // Native: use TextInput with date format
  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.secondary,
          color: colors.foreground,
          borderColor: colors.border,
        },
      ]}
      value={value?.toISOString().split('T')[0] ?? ''}
      onChangeText={handleChange}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      onBlur={onClose}
      autoFocus
      keyboardType="numeric"
    />
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
})
