import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mail, Lock, ArrowRight } from 'lucide-react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/theme'

export default function LoginScreen() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const { colors } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null)

  const handleLogin = async () => {
    setError(null)

    if (!email || !password) {
      setError(t('auth.fillAllFields'))
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
      router.replace('/(tabs)')
    } catch (err: any) {
      console.log('Login error:', err?.message)
      // Show user-friendly error message
      if (err?.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos')
      } else if (err?.message?.includes('Email not confirmed')) {
        setError('Por favor, confirme seu email antes de fazer login')
      } else {
        setError(t('auth.loginError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header with logo/brand */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
              <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
                <Text style={styles.logoText}>H</Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t('auth.welcomeBack')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t('auth.loginSubtitle')}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {t('auth.email')}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.secondary + '80',
                      borderColor: focusedInput === 'email' ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  <Mail
                    size={20}
                    color={focusedInput === 'email' ? colors.accent : colors.mutedForeground}
                    strokeWidth={2}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.accent}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {t('auth.password')}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.secondary + '80',
                      borderColor: focusedInput === 'password' ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  <Lock
                    size={20}
                    color={focusedInput === 'password' ? colors.accent : colors.mutedForeground}
                    strokeWidth={2}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.accent}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Forgot Password */}
              <Pressable style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>
                  {t('auth.forgotPassword')}
                </Text>
              </Pressable>

              {/* Error Message */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              {/* Login Button */}
              <Pressable
                style={[
                  styles.loginButton,
                  { backgroundColor: isLoading ? colors.accent + 'B3' : colors.accent },
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.loginButtonContent}>
                    <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                    <ArrowRight size={20} color={colors.white} strokeWidth={2.5} />
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Sign Up Link */}
            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
              <View style={styles.footerContent}>
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                  {t('auth.noAccount')}
                </Text>
                <Link href="/(auth)/signup" asChild>
                  <Pressable>
                    <Text style={[styles.footerLink, { color: colors.accent }]}>
                      {t('auth.signup')}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 32,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },

  // Form
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingVertical: 32,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
})
