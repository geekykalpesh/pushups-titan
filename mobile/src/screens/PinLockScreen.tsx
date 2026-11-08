import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { QuickNumpad } from '../components/QuickNumpad';
import { Icon } from '../components/Icon';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, unlockWithBiometrics, savedEmail, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDigit = async (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setIsError(false);
    setErrorMessage('');

    if (nextPin.length === 4) {
      const success = await unlockWithPin(nextPin);
      if (!success) {
        setIsError(true);
        setErrorMessage('Incorrect Passcode');
        setTimeout(() => {
          setPin('');
        }, 400);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setIsError(false);
      setErrorMessage('');
    }
  };

  const handleBiometric = async () => {
    const success = await unlockWithBiometrics();
    if (!success) {
      Alert.alert(
        'Biometric Unlock',
        'Place your registered fingerprint on the scanner or enter your 4-digit passcode.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        {/* Shield Icon */}
        <View style={styles.iconCircle}>
          <Icon name="lock" size={32} />
        </View>

        <Text style={styles.title}>SPARTAN SECURITY</Text>
        <Text style={styles.subtitle}>
          Enter your 4-digit passcode to resume your pushup arena
        </Text>

        {savedEmail ? (
          <View style={styles.emailBadge}>
            <Text style={styles.emailText}>{savedEmail}</Text>
          </View>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.numpadWrapper}>
          <QuickNumpad
            pin={pin}
            onDigitPress={handleDigit}
            onDeletePress={handleDelete}
            onBiometricPress={handleBiometric}
          />
        </View>

        {/* Switch account / Password Login */}
        <TouchableOpacity style={styles.switchButton} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.switchText}>Sign In / Register New Account Instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.flamePrimary,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
    maxWidth: 280,
  },
  emailBadge: {
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  emailText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.flameBright,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.urgentRed,
    marginBottom: 12,
  },
  numpadWrapper: {
    marginVertical: 10,
  },
  switchButton: {
    marginTop: 24,
    paddingVertical: 10,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
