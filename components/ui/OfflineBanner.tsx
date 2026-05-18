import { StyleSheet, View } from 'react-native';
import { WKText } from '@/components/ui/WKText';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLabel="Çevrimdışı mod aktif">
      <WKText style={styles.text}>
        📶 Çevrimdışı mod — veriler internete geçince senkronize edilecek
      </WKText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.status.warning,
    paddingVertical: Spacing.s8,
    paddingHorizontal: Spacing.s16,
    alignItems: 'center',
  },
  text: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
