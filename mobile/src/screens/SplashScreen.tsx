import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const MOTIVATIONAL_QUOTES = [
  'Every rep is a brick in your fortress of strength.',
  'Champions don’t wait for motivation. They build habits.',
  'Turn sweat into steel. Push beyond limits.',
  'Today’s pain is tomorrow’s armor.',
  'Fuel the machine: Protein, Discipline, Mastery.',
  'Consistency separates the contenders from the titans.',
];

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, isReady = true }) => {
  const [quote] = useState(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[idx];
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // 1. Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle pulse loop on emblem
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Progress bar fill
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();

    // 4. Timer to exit cleanly
    const timer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        pulseLoop.stop();
        onFinishRef.current?.();
      });
    }, 2400);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      <StatusBar barStyle="light-content" />

      {/* Ambient background glow ring */}
      <View style={styles.ambientGlow} />

      <Animated.View
        style={[
          styles.contentBox,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glowing Logo Container */}
        <Animated.View style={[styles.logoFrame, { transform: [{ scale: pulseAnim }] }]}>
          <Image
            source={require('../assets/app_icon_round.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Typography */}
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>PUSHUP TITAN</Text>
          <Text style={styles.brandSubtitle}>DISCIPLINE OVER EXCUSES</Text>
        </View>
      </Animated.View>

      {/* Bottom Loading / Quote Section */}
      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        <View style={styles.quoteBox}>
          <Text style={styles.quoteMarks}>“</Text>
          <Text style={styles.quoteText}>{quote}</Text>
        </View>

        {/* High-Tech Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        <Text style={styles.loadingStatus}>INITIALIZING COMBAT TELEMETRY...</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0D14',
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: 'rgba(255, 87, 34, 0.08)',
  },
  contentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logoFrame: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#121622',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 214, 0, 0.4)',
    shadowColor: COLORS.flameBright,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  brandGroup: {
    alignItems: 'center',
    marginTop: 24,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 87, 34, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.flameBright,
    letterSpacing: 2.5,
    marginTop: 6,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    right: 30,
    alignItems: 'center',
  },
  quoteBox: {
    marginBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  quoteMarks: {
    fontSize: 24,
    color: COLORS.goldStreak,
    fontWeight: '900',
    lineHeight: 24,
  },
  quoteText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.flamePrimary,
    borderRadius: 2,
  },
  loadingStatus: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 10,
  },
});
