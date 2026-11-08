import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PARTICLES = 40;

const PARTICLE_COLORS = [
  COLORS.flamePrimary,
  COLORS.flameBright,
  COLORS.goldStreak,
  COLORS.vitalityGreen,
  '#FF4081',
  '#00E5FF',
  '#FFFFFF',
];

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
}

export const ConfettiCanvas: React.FC<{ active: boolean }> = ({ active }) => {
  const particles = useRef<Particle[]>(
    Array.from({ length: NUM_PARTICLES }).map(() => ({
      x: new Animated.Value(SCREEN_WIDTH / 2),
      y: new Animated.Value(SCREEN_HEIGHT * 0.45),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.2),
      rotate: new Animated.Value(0),
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: Math.floor(Math.random() * 8) + 8,
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    // Reset and trigger explosion
    const animations = particles.map((p) => {
      p.x.setValue(SCREEN_WIDTH / 2);
      p.y.setValue(SCREEN_HEIGHT * 0.45);
      p.opacity.setValue(1);
      p.scale.setValue(0.2);
      p.rotate.setValue(0);

      const targetX = Math.random() * (SCREEN_WIDTH - 40) + 20;
      const targetY = Math.random() * SCREEN_HEIGHT * 0.8;

      return Animated.parallel([
        Animated.timing(p.x, {
          toValue: targetX,
          duration: 1200 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: targetY,
          duration: 1400 + Math.random() * 600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.scale, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(p.scale, {
            toValue: 0.8,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(p.rotate, {
          toValue: (Math.random() - 0.5) * 8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(900),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(15, animations).start();
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, idx) => {
        const spin = p.rotate.interpolate({
          inputRange: [-4, 4],
          outputRange: ['-720deg', '720deg'],
        });

        return (
          <Animated.View
            key={idx}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size * (idx % 2 === 0 ? 1 : 1.8),
                backgroundColor: p.color,
                borderRadius: idx % 3 === 0 ? p.size / 2 : 2,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
