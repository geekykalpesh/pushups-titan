import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';
import { autoDetectBaseUrl, getBaseUrl, setCustomBaseUrl } from '../api/client';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Server URL status & settings modal
  const [currentServerUrl, setCurrentServerUrl] = useState('');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isTestingServer, setIsTestingServer] = useState(false);

  // Keyboard awareness
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    checkServer();

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const checkServer = async () => {
    try {
      const detected = await autoDetectBaseUrl();
      setCurrentServerUrl(detected);
      setCustomUrlInput(detected);
      setServerOnline(true);
    } catch {
      const fallback = await getBaseUrl();
      setCurrentServerUrl(fallback);
      setCustomUrlInput(fallback);
      setServerOnline(false);
    }
  };

  const handleTestAndSaveUrl = async (urlToTest: string) => {
    setIsTestingServer(true);
    try {
      const cleanUrl = urlToTest.trim().replace(/\/+$/, '');
      const healthCheck = `${cleanUrl}/health`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(healthCheck, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        await setCustomBaseUrl(cleanUrl);
        setCurrentServerUrl(cleanUrl);
        setServerOnline(true);
        setShowServerModal(false);
        setErrorMessage('');
      } else {
        setServerOnline(false);
        setErrorMessage(`Server replied with status ${res.status} at ${cleanUrl}`);
      }
    } catch (err: any) {
      setServerOnline(false);
      setErrorMessage(`Cannot connect to ${urlToTest}: ${err.message || 'Timeout'}`);
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (isRegisterMode) {
      if (!username.trim()) {
        setErrorMessage('Username is required.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
    }

    try {
      setLoading(true);
      if (isRegisterMode) {
        await register(username.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('spartan_test@fit.com');
    setPassword('password123');
    setConfirmPassword('password123');
    setUsername('SpartanTestUser');
    setErrorMessage('');
  };

  const isKeyboardOpen = keyboardHeight > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              justifyContent: isKeyboardOpen ? 'flex-start' : 'center',
              paddingBottom: isKeyboardOpen ? keyboardHeight + 40 : 30,
              paddingTop: isKeyboardOpen ? 12 : 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Server Connectivity Pill */}
          {!isKeyboardOpen && (
            <TouchableOpacity
              style={styles.serverPill}
              onPress={() => setShowServerModal(true)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      serverOnline === true
                        ? COLORS.vitalityGreen
                        : serverOnline === false
                        ? COLORS.urgentRed
                        : COLORS.goldStreak,
                  },
                ]}
              />
              <Text style={styles.serverPillText} numberOfLines={1}>
                {serverOnline === true
                  ? `Online: ${currentServerUrl.replace('http://', '')}`
                  : serverOnline === false
                  ? 'Server Offline (Tap to Configure)'
                  : 'Detecting Server...'}
              </Text>
              <Text style={styles.serverPillEdit}>⚙️</Text>
            </TouchableOpacity>
          )}

          {/* Header Branding (shrinks compactly when keyboard is open) */}
          <View style={[styles.brandHeader, isKeyboardOpen && styles.brandHeaderCompact]}>
            <View style={[styles.logoBadge, isKeyboardOpen && styles.logoBadgeCompact]}>
              <Icon name="flame" size={isKeyboardOpen ? 24 : 36} />
            </View>
            <Text style={[styles.brandTitle, isKeyboardOpen && styles.brandTitleCompact]}>
              PUSHUP TITAN
            </Text>
            {!isKeyboardOpen && (
              <Text style={styles.brandTagline}>Discipline • Strength • Daily Mastery</Text>
            )}
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, !isRegisterMode && styles.activeTab]}
              onPress={() => {
                setIsRegisterMode(false);
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, !isRegisterMode && styles.activeTabText]}>SIGN IN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, isRegisterMode && styles.activeTab]}
              onPress={() => {
                setIsRegisterMode(true);
                setErrorMessage('');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isRegisterMode && styles.activeTabText]}>REGISTER</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isRegisterMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. IronGladiator"
                  placeholderTextColor={COLORS.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={handleInputFocus}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="warrior@gym.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={handleInputFocus}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={handleInputFocus}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={showPassword ? COLORS.flameBright : COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isRegisterMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={handleInputFocus}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Icon
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={showConfirmPassword ? COLORS.flameBright : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Quick Demo Credentials Fill (Dev Only) */}
            {__DEV__ && (
              <TouchableOpacity
                style={styles.demoFillButton}
                onPress={handleQuickDemoFill}
                activeOpacity={0.7}
              >
                <Text style={styles.demoFillText}>⚡ Auto-Fill Demo Credentials (Dev Only)</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isRegisterMode ? 'ENTER THE ARENA 💪' : 'SIGN IN & CRUSH IT 🔥'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.quickPasscodeNote}>
              🛡️ After signing in, you can set a 4-digit Passcode or Fingerprint for instant 1-second access!
            </Text>

            {/* Privacy Policy Link */}
            <TouchableOpacity
              style={styles.privacyLinkBtn}
              onPress={() => setShowPrivacyModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.privacyLinkText}>
                By continuing, you agree to our{' '}
                <Text style={styles.privacyLinkHighlight}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Privacy Policy Full Screen Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <PrivacyPolicyScreen onClose={() => setShowPrivacyModal(false)} />
      </Modal>

      {/* Server Config Modal */}
      <Modal visible={showServerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚙️ Backend Server Settings</Text>
            <Text style={styles.modalSubtitle}>
              Ensure Node.js server is running on port 5000.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customUrlInput}
              onChangeText={setCustomUrlInput}
              placeholder="http://127.0.0.1:5000/api"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.modalSectionLabel}>PRESETS:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[styles.presetButton, { borderColor: COLORS.flameBright, backgroundColor: 'rgba(255, 87, 34, 0.15)' }]}
                onPress={() => setCustomUrlInput('https://pushups-titan.onrender.com/api')}
              >
                <Text style={[styles.presetButtonText, { color: COLORS.flameBright, fontWeight: '800' }]}>☁️ Render</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setCustomUrlInput('http://127.0.0.1:5000/api')}
              >
                <Text style={styles.presetButtonText}>USB (Local)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setCustomUrlInput('http://10.0.2.2:5000/api')}
              >
                <Text style={styles.presetButtonText}>AVD</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => handleTestAndSaveUrl(customUrlInput)}
                disabled={isTestingServer}
              >
                {isTestingServer ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Test & Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  serverPillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    maxWidth: 220,
  },
  serverPillEdit: {
    fontSize: 12,
    marginLeft: 6,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandHeaderCompact: {
    marginBottom: 12,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.flamePrimary,
    marginBottom: 10,
  },
  logoBadgeCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  brandTitleCompact: {
    fontSize: 20,
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.flamePrimary,
    shadowColor: COLORS.flamePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  activeTabText: {
    color: COLORS.white,
  },
  formCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 23, 68, 0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.urgentRed,
  },
  errorText: {
    color: COLORS.urgentRed,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoFillButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 214, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.3)',
    marginBottom: 8,
  },
  demoFillText: {
    color: COLORS.goldStreak,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitButton: {
    backgroundColor: COLORS.flamePrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.flamePrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  quickPasscodeNote: {
    marginTop: 14,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.flamePrimary,
    marginBottom: 16,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  presetButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  modalSaveButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: COLORS.flamePrimary,
  },
  modalSaveText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  privacyLinkBtn: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyLinkText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  privacyLinkHighlight: {
    color: COLORS.flameBright,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
