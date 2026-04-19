import { Stack } from 'expo-router';

export default function SpeakingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="credits" />
      <Stack.Screen name="matching" />
      <Stack.Screen name="session" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
