import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import {
  MoreVertical,
  Trash2,
  Pin,
  PinOff,
  Clock,
  Check,
} from 'lucide-react-native'
import { useTheme, spacing, radius, typography } from '@/theme'
import {
  useNoteQuery,
  useUpdateNote,
  useDeleteNote,
  useToggleNotePin,
} from '@/hooks/use-notes'
import { FormattingToolbar, applyFormatting, type FormatAction } from '@/components/notes'

// =============================================================================
// Helpers
// =============================================================================

function formatLastSaved(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// =============================================================================
// Main Component
// =============================================================================

export default function NoteEditorScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: note, isLoading } = useNoteQuery(id)
  const { mutate: updateNote } = useUpdateNote()
  const { mutate: deleteNote } = useDeleteNote()
  const { mutate: togglePin } = useToggleNotePin()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasChangesRef = useRef(false)
  const contentInputRef = useRef<TextInput>(null)

  // Initialize state from note data
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
    }
  }, [note])

  // Keyboard visibility listener
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true)
    })
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  // Auto-save function
  const saveNote = useCallback(() => {
    if (!hasChangesRef.current) return

    setIsSaving(true)
    updateNote(
      { id, data: { title: title.trim() || 'Untitled', content } },
      {
        onSuccess: () => {
          setIsSaving(false)
          setLastSaved(new Date())
          hasChangesRef.current = false
        },
        onError: () => {
          setIsSaving(false)
        },
      }
    )
  }, [id, title, content, updateNote])

  // Debounced auto-save
  const scheduleAutoSave = useCallback(() => {
    hasChangesRef.current = true

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNote()
    }, 1000)
  }, [saveNote])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      // Save any pending changes
      if (hasChangesRef.current) {
        saveNote()
      }
    }
  }, [saveNote])

  const handleTitleChange = (text: string) => {
    setTitle(text)
    scheduleAutoSave()
  }

  const handleContentChange = (text: string) => {
    setContent(text)
    scheduleAutoSave()
  }

  const handleFormat = useCallback(
    (action: FormatAction) => {
      const result = applyFormatting(action, content, selection)
      setContent(result.content)
      setSelection(result.selection)
      scheduleAutoSave()

      // Re-focus the input and set selection
      setTimeout(() => {
        contentInputRef.current?.focus()
        contentInputRef.current?.setNativeProps({
          selection: result.selection,
        })
      }, 50)
    },
    [content, selection, scheduleAutoSave]
  )

  const handleDelete = () => {
    Alert.alert(
      t('notes.deleteNote'),
      t('notes.deleteNoteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteNote(id, {
              onSuccess: () => {
                router.back()
              },
            })
          },
        },
      ]
    )
    setShowMenu(false)
  }

  const handleTogglePin = () => {
    togglePin(id)
    setShowMenu(false)
  }

  if (isLoading || !note) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen options={{ title: '', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerButtons}>
              {/* Save Status */}
              <View style={styles.saveStatus}>
                {isSaving ? (
                  <Text style={[styles.saveStatusText, { color: colors.mutedForeground }]}>
                    {t('notes.saving')}
                  </Text>
                ) : lastSaved ? (
                  <View style={styles.savedIndicator}>
                    <Check size={14} color="#22c55e" />
                    <Text style={[styles.saveStatusText, { color: colors.mutedForeground }]}>
                      {formatLastSaved(lastSaved)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Pressable onPress={() => setShowMenu(true)} hitSlop={8} style={styles.headerButton}>
                <MoreVertical size={22} color={colors.foreground} />
              </Pressable>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pin indicator */}
          {note.isPinned && (
            <View
             
              style={[styles.pinnedBadge, { backgroundColor: colors.accent + '20' }]}
            >
              <Pin size={14} color={colors.accent} />
              <Text style={[styles.pinnedText, { color: colors.accent }]}>
                {t('notes.pinned')}
              </Text>
            </View>
          )}

          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: colors.foreground }]}
            value={title}
            onChangeText={handleTitleChange}
            placeholder={t('notes.titlePlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={200}
          />

          {/* Last modified */}
          <View style={styles.metaRow}>
            <Clock size={14} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {new Date(note.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Content Input */}
          <TextInput
            ref={contentInputRef}
            style={[styles.contentInput, { color: colors.foreground }]}
            value={content}
            onChangeText={handleContentChange}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            placeholder={t('notes.contentPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Formatting Toolbar */}
        {isKeyboardVisible && <FormattingToolbar onFormat={handleFormat} />}
      </KeyboardAvoidingView>

      {/* Menu Modal */}
      <Modal visible={showMenu} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContent, { backgroundColor: colors.card }]}>
            <Pressable style={styles.menuItem} onPress={handleTogglePin}>
              {note.isPinned ? (
                <>
                  <PinOff size={20} color={colors.foreground} />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                    {t('notes.unpin')}
                  </Text>
                </>
              ) : (
                <>
                  <Pin size={20} color={colors.foreground} />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                    {t('notes.pin')}
                  </Text>
                </>
              )}
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Trash2 size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>
                {t('notes.deleteNote')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerButton: {
    padding: spacing[2],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.size.sm,
  },

  // Save Status
  saveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  saveStatusText: {
    fontSize: typography.size.xs,
  },

  // Pinned Badge
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    marginTop: spacing[4],
  },
  pinnedText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // Title
  titleInput: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginTop: spacing[4],
    paddingVertical: spacing[2],
    lineHeight: 32,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  metaText: {
    fontSize: typography.size.xs,
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: spacing[4],
  },

  // Content
  contentInput: {
    flex: 1,
    fontSize: typography.size.base,
    lineHeight: 24,
    minHeight: 200,
  },

  // Menu Modal
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    borderRadius: radius.xl,
    minWidth: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  menuItemText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  menuDivider: {
    height: 1,
  },
})
