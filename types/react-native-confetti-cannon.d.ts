declare module 'react-native-confetti-cannon' {
  import type React from 'react';
  import type { ViewProps } from 'react-native';

  export interface ConfettiCannonProps extends ViewProps {
    autoStart?: boolean;
    count?: number;
    colors?: string[];
    fadeOut?: boolean;
    fallSpeed?: number;
    explosionSpeed?: number;
    origin?: { x: number; y: number };
    onAnimationEnd?: () => void;
  }

  const ConfettiCannon: React.ComponentType<ConfettiCannonProps>;

  export default ConfettiCannon;
}
