'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettingsStore } from '@/stores/settings'
import { useCreateHabit } from '@/hooks/queries/use-habits'
import {
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Globe,
  CheckCircle2,
  Rocket,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import type { Theme, Locale } from '@/types'

const STEPS = ['welcome', 'name', 'theme', 'language', 'firstHabit', 'done'] as const
type Step = (typeof STEPS)[number]

const SUGGESTED_HABITS = [
  { titleKey: 'drinkWater', color: '#3b82f6', icon: '💧' },
  { titleKey: 'exercise', color: '#22c55e', icon: '🏃' },
  { titleKey: 'read', color: '#a855f7', icon: '📚' },
  { titleKey: 'meditate', color: '#f59e0b', icon: '🧘' },
  { titleKey: 'sleep', color: '#6366f1', icon: '😴' },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

export function OnboardingFlow() {
  const t = useTranslations('onboarding')
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [name, setName] = useState('')
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])

  const { theme, locale, setTheme, setLocale, setUserName, completeOnboarding } =
    useSettingsStore()
  const createHabit = useCreateHabit()

  const step = STEPS[currentStep]

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleNameSubmit = () => {
    if (name.trim()) {
      setUserName(name.trim())
    }
    goNext()
  }

  const handleThemeSelect = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const handleLocaleSelect = (newLocale: Locale) => {
    setLocale(newLocale)
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
  }

  const toggleHabit = (titleKey: string) => {
    setSelectedHabits((prev) =>
      prev.includes(titleKey)
        ? prev.filter((h) => h !== titleKey)
        : [...prev, titleKey]
    )
  }

  const handleFinish = () => {
    // Create selected habits
    selectedHabits.forEach((titleKey) => {
      const habit = SUGGESTED_HABITS.find((h) => h.titleKey === titleKey)
      if (habit) {
        createHabit.mutate({
          title: t(`habits.${titleKey}`),
          areaId: 'health',
          frequency: { type: 'daily' },
          tracking: { type: 'boolean' },
          color: habit.color,
          icon: habit.icon,
        })
      }
    })

    completeOnboarding()
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Progress dots */}
      <div className="absolute top-8 flex gap-2">
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'w-8 bg-primary'
                : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center"
          >
            {step === 'welcome' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
                >
                  <Sparkles className="h-12 w-12 text-primary" />
                </motion.div>
                <h1 className="mb-3 text-3xl font-bold">{t('welcome.title')}</h1>
                <p className="mb-8 text-muted-foreground">{t('welcome.subtitle')}</p>
                <Button size="lg" onClick={goNext} className="gap-2">
                  {t('welcome.start')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {step === 'name' && (
              <>
                <h2 className="mb-3 text-2xl font-bold">{t('name.title')}</h2>
                <p className="mb-6 text-muted-foreground">{t('name.subtitle')}</p>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('name.placeholder')}
                  className="mb-6 text-center text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back')}
                  </Button>
                  <Button onClick={handleNameSubmit}>
                    {t('continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 'theme' && (
              <>
                <h2 className="mb-3 text-2xl font-bold">{t('theme.title')}</h2>
                <p className="mb-6 text-muted-foreground">{t('theme.subtitle')}</p>
                <div className="mb-6 grid w-full grid-cols-3 gap-3">
                  {[
                    { value: 'dark' as const, icon: Moon, label: t('theme.dark') },
                    { value: 'light' as const, icon: Sun, label: t('theme.light') },
                    { value: 'system' as const, icon: Monitor, label: t('theme.system') },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => handleThemeSelect(value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        theme === value
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back')}
                  </Button>
                  <Button onClick={goNext}>
                    {t('continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 'language' && (
              <>
                <Globe className="mb-4 h-12 w-12 text-primary" />
                <h2 className="mb-3 text-2xl font-bold">{t('language.title')}</h2>
                <p className="mb-6 text-muted-foreground">{t('language.subtitle')}</p>
                <div className="mb-6 grid w-full grid-cols-2 gap-3">
                  {[
                    { value: 'pt-BR' as const, label: 'Português', flag: '🇧🇷' },
                    { value: 'en-US' as const, label: 'English', flag: '🇺🇸' },
                  ].map(({ value, label, flag }) => (
                    <button
                      key={value}
                      onClick={() => handleLocaleSelect(value)}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        locale === value
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span className="text-2xl">{flag}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back')}
                  </Button>
                  <Button onClick={goNext}>
                    {t('continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 'firstHabit' && (
              <>
                <CheckCircle2 className="mb-4 h-12 w-12 text-primary" />
                <h2 className="mb-3 text-2xl font-bold">{t('habits.title')}</h2>
                <p className="mb-6 text-muted-foreground">{t('habits.subtitle')}</p>
                <div className="mb-6 flex w-full flex-wrap justify-center gap-2">
                  {SUGGESTED_HABITS.map(({ titleKey, icon }) => (
                    <button
                      key={titleKey}
                      onClick={() => toggleHabit(titleKey)}
                      className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-all ${
                        selectedHabits.includes(titleKey)
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span>{icon}</span>
                      <span className="text-sm">{t(`habits.${titleKey}`)}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back')}
                  </Button>
                  <Button onClick={goNext}>
                    {selectedHabits.length > 0 ? t('continue') : t('skip')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 'done' && (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10"
                >
                  <Rocket className="h-12 w-12 text-green-500" />
                </motion.div>
                <h2 className="mb-3 text-2xl font-bold">{t('done.title')}</h2>
                <p className="mb-8 text-muted-foreground">
                  {name ? t('done.subtitleWithName', { name }) : t('done.subtitle')}
                </p>
                <Button size="lg" onClick={handleFinish} className="gap-2">
                  {t('done.start')}
                  <Sparkles className="h-4 w-4" />
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
