import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack, useRouter } from 'expo-router'
import {
  Plus,
  Search,
  BookOpen,
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { BottomNav } from '@/components'
import {
  useNotebooksQuery,
  useSearchNotes,
  useCreateNotebook,
  NOTEBOOK_COLORS,
  Notebook,
} from '@/hooks/use-notes'

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// =============================================================================
// Components
// =============================================================================

interface NotebookCardProps {
  notebook: Notebook
  onPress: () => void
  delay: number
}

function NotebookCard({ notebook, onPress, delay }: NotebookCardProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  return (
    <View>
      <Pressable
        style={[styles.notebookCard, { backgroundColor: colors.card }, cardShadow]}
        onPress={onPress}
      >
        <View style={[styles.notebookIcon, { backgroundColor: notebook.color + '20' }]}>
          <BookOpen size={24} color={notebook.color} />
        </View>
        <View style={styles.notebookContent}>
          <Text style={[styles.notebookTitle, { color: colors.foreground }]} numberOfLines={1}>
            {notebook.title}
          </Text>
          <Text style={[styles.notebookMeta, { color: colors.mutedForeground }]}>
            {notebook.noteCount} {t('notes.notesCount')} · {formatDate(notebook.updatedAt)}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </Pressable>
    </View>
  )
}

interface SearchResultProps {
  title: string
  preview: string
  onPress: () => void
}

function SearchResult({ title, preview, onPress }: SearchResultProps) {
  const { colors } = useTheme()

  return (
    <Pressable
      style={[styles.searchResult, { borderColor: colors.border }]}
      onPress={onPress}
    >
      <FileText size={18} color={colors.mutedForeground} />
      <View style={styles.searchResultContent}>
        <Text style={[styles.searchResultTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.searchResultPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
          {preview || 'No content'}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  )
}

interface CreateNotebookModalProps {
  visible: boolean
  onClose: () => void
}

function CreateNotebookModal({ visible, onClose }: CreateNotebookModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { mutate: createNotebook, isPending } = useCreateNotebook()

  const [title, setTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState<string>(NOTEBOOK_COLORS[0])

  const handleCreate = () => {
    if (!title.trim()) return

    createNotebook(
      { title: title.trim(), color: selectedColor },
      {
        onSuccess: () => {
          setTitle('')
          setSelectedColor(NOTEBOOK_COLORS[0])
          onClose()
        },
      }
    )
  }

  const handleClose = () => {
    setTitle('')
    setSelectedColor(NOTEBOOK_COLORS[0])
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('notes.newNotebook')}
            </Text>
            <Pressable onPress={handleClose}>
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
              autoFocus
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
              onPress={handleClose}
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
              onPress={handleCreate}
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

export default function NotesScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()

  const { data: notebooks = [], isLoading, refetch } = useNotebooksQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = useSearchNotes(searchQuery)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isSearching = searchQuery.trim().length > 0

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: t('notes.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.headerButton}
            >
              <ChevronLeft size={24} color={colors.foreground} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => setShowCreateModal(true)}
              hitSlop={8}
              style={styles.headerButton}
            >
              <Plus size={22} color={colors.foreground} />
            </Pressable>
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
        {/* Search Bar */}
        <View>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }, cardShadow]}>
            <Search size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder={t('notes.searchPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Search Results */}
        {isSearching ? (
          <View style={styles.searchResults}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('notes.searchResults', { count: searchResults.length })}
            </Text>
            {searchResults.length === 0 ? (
              <View
               
                style={[styles.emptyState, { backgroundColor: colors.card }, cardShadow]}
              >
                <Search size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {t('notes.noSearchResults')}
                </Text>
              </View>
            ) : (
              <View style={[styles.searchResultsCard, { backgroundColor: colors.card }, cardShadow]}>
                {searchResults.map((note, index) => (
                  <View key={note.id}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <SearchResult
                      title={note.title}
                      preview={note.content.substring(0, 100)}
                      onPress={() => router.push(`/notes/note/${note.id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Notebooks */}
            <View style={styles.notebooksSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('notes.notebooks')}
              </Text>

              {notebooks.length === 0 ? (
                <View
                 
                  style={[styles.emptyState, { backgroundColor: colors.card }, cardShadow]}
                >
                  <BookOpen size={48} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    {t('notes.noNotebooks')}
                  </Text>
                  <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
                    {t('notes.noNotebooksDesc')}
                  </Text>
                  <Pressable
                    style={[styles.emptyButton, { backgroundColor: colors.accent }]}
                    onPress={() => setShowCreateModal(true)}
                  >
                    <Plus size={18} color="#fff" />
                    <Text style={styles.emptyButtonText}>
                      {t('notes.createFirst')}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.notebooksList}>
                  {notebooks.map((notebook, index) => (
                    <NotebookCard
                      key={notebook.id}
                      notebook={notebook}
                      onPress={() => router.push(`/notes/notebook/${notebook.id}`)}
                      delay={100 + index * 50}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Create Notebook Modal */}
      <CreateNotebookModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
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
  headerButton: {
    padding: spacing[2],
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
  },

  // Section
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },

  // Notebooks
  notebooksSection: {
    flex: 1,
  },
  notebooksList: {
    gap: spacing[3],
  },
  notebookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  notebookIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notebookContent: {
    flex: 1,
  },
  notebookTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  notebookMeta: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },

  // Search Results
  searchResults: {
    flex: 1,
  },
  searchResultsCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  searchResultPreview: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },
  divider: {
    height: 1,
    marginLeft: spacing[14],
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    borderRadius: radius.xl,
    gap: spacing[3],
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

  // Modal
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
