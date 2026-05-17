import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { WKText } from './WKText';

interface AvatarProps {
  name?: string;
  size?: number;
  imageUri?: string;
}

export function Avatar({ name = '', size = 48, imageUri }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const fontSize = Math.round(size * 0.38);
  const borderRadius = size / 2;

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        accessibilityLabel={`${name} profil fotoğrafı`}
      />
    );
  }

  return (
    <LinearGradient
      colors={Colors.gradient.cta as [string, string]}
      style={[styles.gradient, { width: size, height: size, borderRadius }]}
      accessibilityLabel={`${name || 'Kullanıcı'} avatarı`}
    >
      <View style={styles.inner}>
        <WKText style={[styles.initials, { fontSize }]}>
          {initials || '?'}
        </WKText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.text.onColor,
    fontFamily: 'Inter_700Bold',
  },
  image: {
    resizeMode: 'cover',
  },
});
