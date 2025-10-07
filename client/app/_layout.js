import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="screens/Home" options={{ headerShown: false }} />
      <Stack.Screen name="screens/Backup" options={{ title: 'Backup' }} />
      <Stack.Screen name="screens/Restore" options={{ title: 'Restore' }} />
    </Stack>
  );
}