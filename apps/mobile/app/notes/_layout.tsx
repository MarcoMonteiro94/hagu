import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { colors } from '@/theme'

export default function NotesLayout() {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = isDark ? colors.dark : colors.light

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.foreground,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Notes',
        }}
      />
      <Stack.Screen
        name="notebook/[id]"
        options={{
          title: '',
        }}
      />
      <Stack.Screen
        name="note/[id]"
        options={{
          title: '',
        }}
      />
    </Stack>
  )
}
