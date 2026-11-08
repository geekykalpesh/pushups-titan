import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { playSound, SoundType } from '../utils/soundEffects';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  sound?: SoundType;
  scaleActive?: number;
  disabled?: boolean;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  sound,
  scaleActive = 0.94,
  disabled = false,
  onPress,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: scaleActive,
      tension: 250,
      friction: 12,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      tension: 250,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (e: any) => {
    if (disabled) return;
    if (sound) {
      playSound(sound);
    }
    onPress?.(e);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
