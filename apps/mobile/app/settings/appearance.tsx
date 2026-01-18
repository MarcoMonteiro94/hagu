import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  Sun,
  Moon,
  Smartphone,
  Check,
  Globe,
  Palette,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, useThemeContext, cardShadow, spacing, radius, typography, ThemeMode } from '@/theme'
import i18n from '@/i18n'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect } from 'react'

// =============================================================================
// Types
// =============================================================================

type LanguageCode = 'en-US' | 'pt-BR'

// =============================================================================
// Constants
// =============================================================================

const LANGUAGE_STORAGE_KEY = 'app-language'

const THEME_OPTIONS: { value: ThemeMode; labelKey: string; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'settings.themeLight', icon: Sun },
  { value: 'dark', labelKey: 'settings.themeDark', icon: Moon },
  { value: 'system', labelKey: 'settings.themeSystem', icon: Smartphone },
]

const LANGUAGE_OPTIONS: { value: LanguageCode; label: string; flag: string }[] = [
  { value: 'en-US', label: 'English', flag: '🇺🇸' },
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
]

// =============================================================================
// Components
// =============================================================================

interface OptionCardProps {
  icon: React.ReactNode
  label: string
  description?: string
  isSelected: boolean
  onPress: () => void
}

function OptionCard({ icon, label, description, isSelected, onPress }: OptionCardProps) {
  const { colors } = useTheme()

  return (
    <Pressable
      style={[
        styles.optionCard,
        {
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.accent : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
        cardShadow,
      ]}
      onPress={onPress}
    >
      <View style={[styles.optionIcon, { backgroundColor: isSelected ? colors.accent + '20' : colors.muted }]}>
        {icon}
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionLabel, { color: colors.foreground }]}>{label}</Text>
        {description && (
          <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: colors.accent }]}>
          <Check size={14} color="#fff" />
        </View>
      )}
    </Pressable>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function AppearanceScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { themeMode, setThemeMode } = useThemeContext()

  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(i18n.language as LanguageCode)

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
        if (saved && ['en-US', 'pt-BR'].includes(saved)) {
          setCurrentLanguage(saved as LanguageCode)
        }
      } catch (error) {
        console.error('Failed to load language:', error)
      }
    }
    loadLanguage()
  }, [])

  const handleLanguageChange = async (language: LanguageCode) => {
    setCurrentLanguage(language)
    i18n.changeLanguage(language)
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch (error) {
      console.error('Failed to save language:', error)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('settings.appearance'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Section */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('settings.themeTitle')}
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            {t('settings.themeDescription')}
          </Text>

          <View style={styles.optionsGrid}>
            {THEME_OPTIONS.map(option => {
              const Icon = option.icon
              return (
                <OptionCard
                  key={option.value}
                  icon={<Icon size={24} color={themeMode === option.value ? colors.accent : colors.mutedForeground} />}
                  label={t(option.labelKey)}
                  isSelected={themeMode === option.value}
                  onPress={() => setThemeMode(option.value)}
                />
              )
            })}
          </View>
        </Animated.View>

        {/* Language Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('settings.languageTitle')}
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.mutedForeground }]}>
            {t('settings.languageDescription')}
          </Text>

          <View style={styles.languageOptions}>
            {LANGUAGE_OPTIONS.map(option => (
              <OptionCard
                key={option.value}
                icon={<Text style={styles.flag}>{option.flag}</Text>}
                label={option.label}
                isSelected={currentLanguage === option.value}
                onPress={() => handleLanguageChange(option.value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Preview */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
          <View style={[styles.previewCard, { backgroundColor: colors.card }, cardShadow]}>
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>
              {t('settings.preview')}
            </Text>
            <Text style={[styles.previewText, { color: colors.mutedForeground }]}>
              {t('settings.previewText')}
            </Text>
            <View style={styles.previewColors}>
              <View style={[styles.previewColor, { backgroundColor: colors.background }]}>
                <Text style={[styles.previewColorLabel, { color: colors.foreground }]}>Bg</Text>
              </View>
              <View style={[styles.previewColor, { backgroundColor: colors.card }]}>
                <Text style={[styles.previewColorLabel, { color: colors.foreground }]}>Card</Text>
              </View>
              <View style={[styles.previewColor, { backgroundColor: colors.accent }]}>
                <Text style={[styles.previewColorLabel, { color: '#fff' }]}>Accent</Text>
              </View>
              <View style={[styles.previewColor, { backgroundColor: colors.muted }]}>
                <Text style={[styles.previewColorLabel, { color: colors.foreground }]}>Muted</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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

  // Section
  section: {
    marginTop: spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  sectionDescription: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },

  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  languageOptions: {
    gap: spacing[3],
  },

  // Option Card
  optionCard: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.xl,
    gap: spacing[2],
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing[0.5],
  },
  checkmark: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Flag
  flag: {
    fontSize: 28,
  },

  // Preview
  previewCard: {
    padding: spacing[5],
    borderRadius: radius.xl,
  },
  previewTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[2],
  },
  previewText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  previewColors: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  previewColor: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewColorLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
})
