import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { Icon } from './Icon';
import { safeVibrate } from '../utils/haptics';

interface QuickNumpadProps {
  pin: string;
  maxDigits?: number;
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  onBiometricPress?: () => void;
}

export const QuickNumpad: React.FC<QuickNumpadProps> = ({
  pin,
  maxDigits = 4,
  onDigitPress,
  onDeletePress,
  onBiometricPress,
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const handlePress = (d: string) => {
    safeVibrate(30);
    onDigitPress(d);
  };

  const handleDelete = () => {
    safeVibrate(30);
    onDeletePress();
  };

  return (
    <View style={styles.container}>
      {/* 4 Digit Indicators */}
      <View style={styles.dotsRow}>
        {Array.from({ length: maxDigits }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isFilled && styles.dotFilled,
                isFilled && { borderColor: COLORS.flamePrimary, backgroundColor: COLORS.flamePrimary },
              ]}
            />
          );
        })}
      </View>

      {/* Keypad Grid */}
      <View style={styles.grid}>
        {digits.map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.keyButton}
            onPress={() => handlePress(num)}
            activeOpacity={0.7}
          >
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}

        {/* Bottom row: Biometric, 0, Delete */}
        <TouchableOpacity
          style={[styles.keyButton, styles.specialButton]}
          onPress={onBiometricPress}
          activeOpacity={0.7}
        >
          <Icon name="fingerprint" size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.keyButton}
          onPress={() => handlePress('0')}
          activeOpacity={0.7}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.keyButton, styles.specialButton]}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.backspaceText}>⌫</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: 'transparent',
    marginHorizontal: 12,
  },
  dotFilled: {
    transform: [{ scale: 1.15 }],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
  },
  keyButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specialButton: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  backspaceText: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
