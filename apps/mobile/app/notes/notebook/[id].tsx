import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import {
  Plus,
  FileText,
  Pin,
  MoreVertical,
  Trash2,
  Edit3,
  ChevronLeft,
  X,
  Check,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { BottomNav } from '@/components'
import {
  useNotebookQuery,
  useNotesQuery,
  useCreateNote,
  useDeleteNotebook,
  useUpdateNotebook,
  NOTEBOOK_COLORS,
  Note,
} from '@/hooks/use-notes'

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Less than 24 hours
  if (diff < 86400000) {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Less than 7 days
  if (diff < 604800000) {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
    })
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// Components
// =============================================================================

interface NoteCardProps {
  note: Note
  onPress: () => void
  delay: number
  cardWidth: number
}

function NoteCard({ note, onPress, delay, cardWidth }: NoteCardProps) {
  const { colors } = useTheme()

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={{ width: cardWidth }}>
      <Pressable
        style={[styles.noteCard, { backgroundColor: colors.card }, cardShadow]}
        onPress={onPress}
      >
        <View style={styles.noteCardHeader}>
          <FileText size={18} color={colors.accent} />
          {note.isPinned && <Pin size={14} color={colors.accent} />}
        </View>
        <Text style={[styles.noteTitle, { color: colors.foreground }]} numberOfLines={1}>
          {note.title}
        </Text>
        <Text style={[styles.notePreview, { color: colors.mutedForeground }]} numberOfLines={2}>
          {note.content || 'No content'}
        </Text>
        <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>
          {formatDate(note.updatedAt)}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

interface EditNotebookModalProps {
  visible: boolean
  onClose: () => void
  notebook: { id: string; title: string; color: string } | null
}

function EditNotebookModal({ visible, onClose, notebook }: EditNotebookModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { mutate: updateNotebook, isPending } = useUpdateNotebook()

  const [title, setTitle] = useState(notebook?.title || '')
  const [selectedColor, setSelectedColor] = useState(notebook?.color || NOTEBOOK_COLORS[0])

  // Update state when notebook changes
  if (notebook && (title !== notebook.title || selectedColor !== notebook.color)) {
    setTitle(notebook.title)
    setSelectedColor(notebook.color)
  }

  const handleUpdate = () => {
    if (!title.trim() || !notebook) return

    updateNotebook(
      { id: notebook.id, data: { title: title.trim(), color: selectedColor } },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('notes.editNotebook')}
            </Text>
            <Pressable onPress={onClose}>
              <X size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              {t('notes.notebookName')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder={t('notes.notebookNamePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: spacing[4] }]}>
              {t('notes.color')}
            </Text>
            <View style={styles.colorGrid}>
              {NOTEBOOK_COLORS.map(color => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Check size={18} color="#fff" />}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.cancelButton, { backgroundColor: colors.muted }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.createButton,
                { backgroundColor: colors.accent, opacity: !title.trim() || isPending ? 0.5 : 1 },
              ]}
              onPress={handleUpdate}
              disabled={!title.trim() || isPending}
            >
              <Text style={styles.createButtonText}>
                {t('common.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// =============================================================================
// Main Component
// =============================================================================

// Constants for grid calculation
const GRID_GAP = spacing[3] // 12px
const HORIZONTAL_PADDING = spacing[4] // 16px
const NUM_COLUMNS = 2

export default function NotebookScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { width: screenWidth } = useWindowDimensions()

  const notebook = useNotebookQuery(id)
  const { data: notes = [], isLoading, refetch } = useNotesQuery(id)
  const { mutate: createNote } = useCreateNote()
  const { mutate: deleteNotebook } = useDeleteNotebook()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Calculate card width: (screen - horizontal padding * 2 - gap between cards) / num columns
  const cardWidth = (screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

  // Sort notes: pinned first, then by updated date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const handleCreateNote = () => {
    createNote(
      { notebookId: id, title: 'Untitled', content: '' },
      {
        onSuccess: (newNote) => {
          router.push(`/notes/note/${newNote.id}`)
        },
      }
    )
  }

  const handleDeleteNotebook = () => {
    Alert.alert(
      t('notes.deleteNotebook'),
      t('notes.deleteNotebookConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteNotebook(id, {
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

  if (!notebook) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: notebook.title,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.foreground} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable onPress={handleCreateNote} hitSlop={8} style={styles.headerButton}>
                <Plus size={22} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={() => setShowMenu(true)} hitSlop={8} style={styles.headerButton}>
                <MoreVertical size={22} color={colors.foreground} />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      >
        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={[styles.statsCard, { backgroundColor: notebook.color + '15' }]}
        >
          <Text style={[styles.statsValue, { color: notebook.color }]}>
            {notes.length}
          </Text>
          <Text style={[styles.statsLabel, { color: notebook.color }]}>
            {t('notes.notesCount')}
          </Text>
        </Animated.View>

        {/* Notes Grid */}
        {sortedNotes.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.emptyState, { backgroundColor: colors.card }, cardShadow]}
          >
            <FileText size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('notes.noNotes')}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              {t('notes.noNotesDesc')}
            </Text>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: colors.accent }]}
              onPress={handleCreateNote}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>
                {t('notes.createFirstNote')}
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.notesGrid}>
            {sortedNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() => router.push(`/notes/note/${note.id}`)}
                delay={100 + index * 50}
                cardWidth={cardWidth}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={showMenu} animationType="fade" transparent>
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContent, { backgroundColor: colors.card }, cardShadow]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false)
                setShowEditModal(true)
              }}
            >
              <Edit3 size={20} color={colors.foreground} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                {t('notes.editNotebook')}
              </Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <Pressable style={styles.menuItem} onPress={handleDeleteNotebook}>
              <Trash2 size={20} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>
                {t('notes.deleteNotebook')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Notebook Modal */}
      <EditNotebookModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        notebook={notebook ? { id: notebook.id, title: notebook.title, color: notebook.color } : null}
      />

      {/* Bottom Navigation */}
      <BottomNav />
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
    gap: spacing[2],
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

  // Stats
  statsCard: {
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  statsValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  statsLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Notes Grid
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  noteCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    gap: spacing[2],
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  notePreview: {
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
  noteDate: {
    fontSize: typography.size.xs,
    marginTop: spacing[1],
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    borderRadius: radius.xl,
    gap: spacing[3],
    marginTop: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
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

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing[5],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  modalBody: {
    marginBottom: spacing[5],
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[2],
  },
  input: {
    fontSize: typography.size.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[3.5],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  createButton: {
    flex: 1,
    paddingVertical: spacing[3.5],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
})
