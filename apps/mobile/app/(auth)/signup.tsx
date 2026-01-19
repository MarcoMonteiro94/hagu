import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mail, Lock, UserPlus, ShieldCheck } from 'lucide-react-native'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/theme'

type FocusedInput = 'email' | 'password' | 'confirmPassword' | null

export default function SignupScreen() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const { colors } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState<FocusedInput>(null)

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'))
      return
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'))
      return
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.weakPassword'))
      return
    }

    setIsLoading(true)
    try {
      await signUp(email, password)
      Alert.alert(
        'Sucesso',
        'Conta criada! Por favor, verifique seu e-mail para ativar sua conta.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      )
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.signupError'))
    } finally {
      setIsLoading(false)
    }
  }

  const getInputBorderColor = (inputName: FocusedInput) =>
    focusedInput === inputName ? colors.accent : 'transparent'

  const getIconColor = (inputName: FocusedInput) =>
    focusedInput === inputName ? colors.accent : colors.mutedForeground

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
            <View style={styles.header}>
              <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
                <Text style={styles.logoText}>H</Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t('auth.signupTitle')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t('auth.signupSubtitle')}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
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
                      borderColor: getInputBorderColor('email'),
                    },
                  ]}
                >
                  <Mail size={20} color={getIconColor('email')} strokeWidth={2} />
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
                      borderColor: getInputBorderColor('password'),
                    },
                  ]}
                >
                  <Lock size={20} color={getIconColor('password')} strokeWidth={2} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.accent}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {t('auth.confirmPassword')}
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.secondary + '80',
                      borderColor: getInputBorderColor('confirmPassword'),
                    },
                  ]}
                >
                  <ShieldCheck size={20} color={getIconColor('confirmPassword')} strokeWidth={2} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="Confirme sua senha"
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.accent}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Signup Button */}
              <Pressable
                style={[
                  styles.signupButton,
                  { backgroundColor: isLoading ? colors.accent + 'B3' : colors.accent },
                ]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.signupButtonContent}>
                    <Text style={styles.signupButtonText}>{t('auth.signup')}</Text>
                    <UserPlus size={20} color={colors.white} strokeWidth={2.5} />
                  </View>
                )}
              </Pressable>
            </View>

            {/* Terms note */}
            <View style={styles.terms}>
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                Ao criar uma conta, você concorda com nossos{' '}
                <Text style={{ color: colors.accent }}>Termos de Uso</Text> e{' '}
                <Text style={{ color: colors.accent }}>Política de Privacidade</Text>
              </Text>
            </View>

            {/* Sign In Link */}
            <View style={styles.footer}>
              <View style={styles.footerContent}>
                <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                  {t('auth.hasAccount')}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text style={[styles.footerLink, { color: colors.accent }]}>
                      {t('auth.login')}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
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
    paddingBottom: 24,
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
    gap: 16,
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
  signupButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Terms
  terms: {
    marginTop: 24,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
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
