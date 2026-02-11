import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { setupNotificationListeners } from '@/services/notificationServices';

export const unstable_settings = {
  initialRouteName: 'homescreen',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Set up notification tap handler for deep linking
    const subscription = setupNotificationListeners();

    // Cleanup listener on unmount
    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
