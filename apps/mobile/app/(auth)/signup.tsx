import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/lib/auth'

export default function SignupScreen() {
  const { t } = useTranslation()
  const { signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.signupError'))
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
        'Success',
        'Account created! Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      )
    } catch (error) {
      Alert.alert(t('common.error'), t('auth.signupError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-12">
        <View className="mb-12">
          <Text className="text-4xl font-bold text-foreground">Hagu</Text>
          <Text className="mt-2 text-lg text-muted-foreground">
            {t('auth.signup')}
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">
              {t('auth.email')}
            </Text>
            <TextInput
              className="h-12 rounded-lg border border-input bg-background px-4 text-foreground"
              placeholder="email@example.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">
              {t('auth.password')}
            </Text>
            <TextInput
              className="h-12 rounded-lg border border-input bg-background px-4 text-foreground"
              placeholder="••••••••"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-foreground">
              {t('auth.confirmPassword')}
            </Text>
            <TextInput
              className="h-12 rounded-lg border border-input bg-background px-4 text-foreground"
              placeholder="••••••••"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <Pressable
            className="mt-4 h-12 items-center justify-center rounded-lg bg-primary"
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-semibold text-primary-foreground">
                {t('auth.signup')}
              </Text>
            )}
          </Pressable>
        </View>

        <View className="mt-auto pb-8">
          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-muted-foreground">{t('auth.hasAccount')}</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="font-semibold text-primary">
                  {t('auth.login')}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
