import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { updateGoals } from '../api/authApi';
import { getBaseUrl, setCustomBaseUrl } from '../api/client';
import { Icon } from '../components/Icon';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';

export const ProfileScreen: React.FC = () => {
  const { user, setupPin, hasPinConfigured, logout, refreshUser } = useAuth();

  // PIN setup state
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // Daily goals state
  const [pushupGoal, setPushupGoal] = useState(String(user?.daily_pushup_goal || 100));
  const [eggGoal, setEggGoal] = useState(String(user?.daily_egg_goal || 4));
  const [proteinGoal, setProteinGoal] = useState(String(user?.daily_protein_goal || 30.0));
  const [savingGoals, setSavingGoals] = useState(false);

  // Server URL settings
  const [serverUrl, setServerUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);

  // Privacy Policy modal
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  React.useEffect(() => {
    getBaseUrl().then(setServerUrl);
  }, []);

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      Alert.alert('Invalid PIN', 'Passcode must be exactly 4 numeric digits.');
      return;
    }
    if (pinInput !== pinConfirm) {
      Alert.alert('Mismatch', 'PIN and confirmation do not match.');
      return;
    }

    try {
      setSavingPin(true);
      await setupPin(pinInput);
      Alert.alert(
        'Passcode Activated! 🛡️',
        'Your 4-digit passcode is active! Next time you open the app, you can unlock instantly in 1 second.'
      );
      setPinInput('');
      setPinConfirm('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save passcode.');
    } finally {
      setSavingPin(false);
    }
  };

  const handleSaveGoals = async () => {
    const pGoal = parseInt(pushupGoal, 10);
    const eGoal = parseInt(eggGoal, 10);
    const prGoal = parseFloat(proteinGoal);

    if (isNaN(pGoal) || pGoal <= 0 || isNaN(eGoal) || eGoal <= 0 || isNaN(prGoal) || prGoal <= 0) {
      Alert.alert('Invalid Values', 'Please enter positive numbers for your targets.');
      return;
    }

    try {
      setSavingGoals(true);
      await updateGoals({
        daily_pushup_goal: pGoal,
        daily_egg_goal: eGoal,
        daily_protein_goal: prGoal,
      });
      await refreshUser();
      Alert.alert('Success', 'Daily targets updated!');
    } catch {
      Alert.alert('Error', 'Failed to update goals.');
    } finally {
      setSavingGoals(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!serverUrl.trim()) return;
    await setCustomBaseUrl(serverUrl.trim());
    Alert.alert('Updated', 'API server endpoint updated!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>WARRIOR PROFILE</Text>
            <Text style={styles.headerSubtitle}>Account & Security Settings</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>⚔️</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.usernameText}>{user?.username || 'Warrior'}</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
            <View style={styles.pinStatusBadge}>
              <Text
                style={[
                  styles.pinStatusText,
                  { color: hasPinConfigured ? COLORS.vitalityGreen : COLORS.goldStreak },
                ]}
              >
                {hasPinConfigured ? '✓ 4-Digit Passcode Active' : '⚠️ No Passcode Set'}
              </Text>
            </View>
          </View>
        </View>

        {/* 4-Digit Passcode Setup Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="lock" size={20} color={COLORS.flameBright} />
            <Text style={styles.sectionTitle}>
              {hasPinConfigured ? 'CHANGE 4-DIGIT PASSCODE' : 'SET 4-DIGIT QUICK PASSCODE'}
            </Text>
          </View>
          <Text style={styles.sectionSub}>
            Allows you and your biometric fingerprint to unlock the app instantly without entering your
            email & password every day.
          </Text>

          <View style={styles.pinInputRow}>
            <TextInput
              style={styles.pinTextInput}
              placeholder="4-digit PIN"
              placeholderTextColor={COLORS.textMuted}
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />

            <TextInput
              style={styles.pinTextInput}
              placeholder="Confirm PIN"
              placeholderTextColor={COLORS.textMuted}
              value={pinConfirm}
              onChangeText={setPinConfirm}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.savePinBtn}
            onPress={handleSavePin}
            disabled={savingPin}
            activeOpacity={0.85}
          >
            {savingPin ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.savePinBtnText}>
                {hasPinConfigured ? 'UPDATE PASSCODE 🔒' : 'ACTIVATE PASSCODE 🔒'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Daily Goals Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="trophy" size={20} color={COLORS.goldStreak} />
            <Text style={styles.sectionTitle}>DAILY TARGETS</Text>
          </View>
          <Text style={styles.sectionSub}>
            Customize your daily benchmark for pushups, eggs, and protein
          </Text>

          <View style={styles.goalField}>
            <Text style={styles.goalLabel}>DAILY PUSHUPS GOAL</Text>
            <TextInput
              style={styles.goalInput}
              value={pushupGoal}
              onChangeText={setPushupGoal}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.goalField}>
            <Text style={styles.goalLabel}>DAILY EGGS GOAL</Text>
            <TextInput
              style={styles.goalInput}
              value={eggGoal}
              onChangeText={setEggGoal}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.goalField}>
            <Text style={styles.goalLabel}>DAILY PROTEIN GOAL (GRAMS)</Text>
            <TextInput
              style={styles.goalInput}
              value={proteinGoal}
              onChangeText={setProteinGoal}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.saveGoalsBtn}
            onPress={handleSaveGoals}
            disabled={savingGoals}
            activeOpacity={0.85}
          >
            {savingGoals ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.saveGoalsBtnText}>SAVE DAILY GOALS</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server Endpoint Settings */}
        <TouchableOpacity
          style={styles.toggleServerBtn}
          onPress={() => setShowServerConfig((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleServerText}>
            ⚙️ Server Endpoint Settings {showServerConfig ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {showServerConfig && (
          <View style={styles.serverConfigCard}>
            <Text style={styles.serverConfigLabel}>BACKEND API URL</Text>
            <TextInput
              style={styles.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveServerBtn} onPress={handleSaveServerUrl}>
              <Text style={styles.saveServerBtnText}>Update Server URL</Text>
            </TouchableOpacity>
            <Text style={styles.serverHint}>
              • Android Emulator: http://10.0.2.2:5000/api{'\n'}• Physical Device (Wi-Fi):
              http://10.68.120.150:5000/api{'\n'}• Physical Device (USB):
              http://127.0.0.1:5000/api
            </Text>
          </View>
        )}

        {/* Legal & Privacy Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="check" size={20} color={COLORS.cyanGlow} />
            <Text style={styles.sectionTitle}>LEGAL & POLICIES</Text>
          </View>
          <Text style={styles.sectionSub}>
            Review data privacy, security practices, and terms of service.
          </Text>

          <TouchableOpacity
            style={styles.privacyBtn}
            onPress={() => setShowPrivacyPolicy(true)}
            activeOpacity={0.8}
          >
            <View style={styles.privacyBtnContent}>
              <Text style={styles.privacyBtnIcon}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.privacyBtnTitle}>Privacy Policy</Text>
                <Text style={styles.privacyBtnSub}>Data collection, retention, & security disclosure</Text>
              </View>
              <Text style={styles.privacyBtnArrow}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.appMetaRow}>
            <Text style={styles.appMetaText}>Pushup Titan • v1.0.0 (Build 1)</Text>
            <Text style={styles.appMetaDev}>Developer: GeekyKalpesh</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Privacy Policy Full-Screen Modal */}
      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <PrivacyPolicyScreen onClose={() => setShowPrivacyPolicy(false)} />
      </Modal>
    </View>
  </KeyboardAvoidingView>
</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 240,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.flamePrimary,
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  userInfo: {
    flex: 1,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  emailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pinStatusBadge: {
    marginTop: 6,
  },
  pinStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.2,
    marginLeft: 8,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 17,
  },
  pinInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pinTextInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  savePinBtn: {
    backgroundColor: COLORS.flamePrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  savePinBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  goalField: {
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  goalInput: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveGoalsBtn: {
    backgroundColor: COLORS.goldStreak,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveGoalsBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.black,
    letterSpacing: 1,
  },
  toggleServerBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  toggleServerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  serverConfigCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  serverConfigLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  serverInput: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  saveServerBtn: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  saveServerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  serverHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 10,
    lineHeight: 16,
  },
  privacyBtn: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    marginBottom: 12,
  },
  privacyBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyBtnIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyBtnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  privacyBtnSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  privacyBtnArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  appMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  appMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  appMetaDev: {
    fontSize: 11,
    color: COLORS.flameBright,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.urgentRed,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.urgentRed,
    letterSpacing: 1.5,
  },
});
