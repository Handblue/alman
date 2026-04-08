import { Stack } from 'expo-router';

export default function BattleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="lobby" />
      <Stack.Screen name="vs" />
      <Stack.Screen name="question" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
