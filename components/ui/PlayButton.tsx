import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { WKText } from './WKText';
import { Colors } from '@/constants/colors';
import { Shadows } from '@/constants/shadows';

interface Props {
  onPress: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  size?: number;
  disabled?: boolean;
}

export function PlayButton({
  onPress,
  isPlaying,
  isLoading,
  size = 56,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isPlaying
          ? Colors.brand.primary
          : Colors.brand.dark,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.level2,
      }}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.text.primaryDark} size="small" />
      ) : (
        <WKText style={{ fontSize: size * 0.4, color: Colors.text.primaryDark }}>
          {isPlaying ? '■' : '▶'}
        </WKText>
      )}
    </TouchableOpacity>
  );
}
