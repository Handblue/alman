import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
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
        <Ionicons
          name={isPlaying ? 'stop' : 'play'}
          size={size * 0.5}
          color={Colors.text.primaryDark}
        />
      )}
    </TouchableOpacity>
  );
}
