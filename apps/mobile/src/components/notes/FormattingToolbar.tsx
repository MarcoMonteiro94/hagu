import { View, Pressable, StyleSheet, ScrollView, Text } from 'react-native'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Link,
  Quote,
  Minus,
  Code,
  CheckSquare,
} from 'lucide-react-native'
import { useTheme, spacing, radius } from '@/theme'

// =============================================================================
// Types
// =============================================================================

type FormatAction =
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'bullet'
  | 'numbered'
  | 'checklist'
  | 'quote'
  | 'code'
  | 'link'
  | 'divider'

interface FormattingToolbarProps {
  onFormat: (action: FormatAction) => void
}

// =============================================================================
// Toolbar Button Component
// =============================================================================

interface ToolbarButtonProps {
  icon: React.ReactNode
  onPress: () => void
  label?: string
}

function ToolbarButton({ icon, onPress, label }: ToolbarButtonProps) {
  const { colors } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolbarButton,
        { backgroundColor: pressed ? colors.muted : 'transparent' },
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {icon}
    </Pressable>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function FormattingToolbar({ onFormat }: FormattingToolbarProps) {
  const { colors } = useTheme()

  const iconSize = 20
  const iconColor = colors.foreground

  return (
    <View style={[styles.container, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        <ToolbarButton
          icon={<Bold size={iconSize} color={iconColor} />}
          onPress={() => onFormat('bold')}
          label="Bold"
        />
        <ToolbarButton
          icon={<Italic size={iconSize} color={iconColor} />}
          onPress={() => onFormat('italic')}
          label="Italic"
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ToolbarButton
          icon={<Heading1 size={iconSize} color={iconColor} />}
          onPress={() => onFormat('h1')}
          label="Heading 1"
        />
        <ToolbarButton
          icon={<Heading2 size={iconSize} color={iconColor} />}
          onPress={() => onFormat('h2')}
          label="Heading 2"
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ToolbarButton
          icon={<List size={iconSize} color={iconColor} />}
          onPress={() => onFormat('bullet')}
          label="Bullet List"
        />
        <ToolbarButton
          icon={<ListOrdered size={iconSize} color={iconColor} />}
          onPress={() => onFormat('numbered')}
          label="Numbered List"
        />
        <ToolbarButton
          icon={<CheckSquare size={iconSize} color={iconColor} />}
          onPress={() => onFormat('checklist')}
          label="Checklist"
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ToolbarButton
          icon={<Quote size={iconSize} color={iconColor} />}
          onPress={() => onFormat('quote')}
          label="Quote"
        />
        <ToolbarButton
          icon={<Code size={iconSize} color={iconColor} />}
          onPress={() => onFormat('code')}
          label="Code"
        />
        <ToolbarButton
          icon={<Link size={iconSize} color={iconColor} />}
          onPress={() => onFormat('link')}
          label="Link"
        />
        <ToolbarButton
          icon={<Minus size={iconSize} color={iconColor} />}
          onPress={() => onFormat('divider')}
          label="Divider"
        />
      </ScrollView>
    </View>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: spacing[2],
  },
  scrollContent: {
    paddingHorizontal: spacing[2],
    gap: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: spacing[1],
  },
})
