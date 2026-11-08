import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useReminders } from '../context/ReminderContext';
import { Reminder } from '../api/remindersApi';
import { Icon } from '../components/Icon';

export const AlarmsScreen: React.FC = () => {
  const {
    reminders,
    isLoading,
    addReminder,
    toggleReminder,
    removeReminder,
    triggerManualAlarmTest,
  } = useReminders();

  const [modalVisible, setModalVisible] = useState(false);
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [title, setTitle] = useState('Pushup Strike');
  const [targetCount, setTargetCount] = useState('25');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const reps = parseInt(targetCount, 10);

    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      Alert.alert('Invalid Time', 'Please enter valid hours (0-23) and minutes (0-59).');
      return;
    }

    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    try {
      setSaving(true);
      await addReminder({
        title: title.trim() || 'Pushup Alert',
        reminder_time: timeStr,
        is_active: true,
        target_count: reps > 0 ? reps : 20,
        days_of_week: '1,2,3,4,5,6,7',
      });
      setModalVisible(false);
      Alert.alert('Alarm Scheduled', `Pushup reminder set for ${timeStr}!`);
    } catch {
      Alert.alert('Error', 'Could not schedule reminder.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number, timeStr: string) => {
    Alert.alert('Delete Alarm', `Delete alarm set for ${timeStr}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeReminder(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PUSHUP ALARMS</Text>
          <Text style={styles.headerSubtitle}>Automated Discipline Prompts</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="alarm" size={24} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>TACTICAL SCHEDULE</Text>
            <Text style={styles.infoText}>
              Set alarms throughout your day. When the alarm strikes, the app will ring and alert
              you with tactical pushup prompts!
            </Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.flamePrimary} style={{ marginTop: 40 }} />
        ) : reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyTitle}>No Pushup Alarms Set</Text>
            <Text style={styles.emptySub}>
              Tap the (+) button above to set reminders every hour or at specific times.
            </Text>
          </View>
        ) : (
          reminders.map((alarm) => {
            const displayTime = alarm.reminder_time.substring(0, 5);

            return (
              <View
                key={alarm.id}
                style={[
                  styles.alarmCard,
                  !alarm.is_active && { opacity: 0.6, borderColor: COLORS.border },
                ]}
              >
                <View style={styles.alarmLeft}>
                  <Text style={styles.alarmTime}>{displayTime}</Text>
                  <Text style={styles.alarmTitle}>{alarm.title}</Text>
                  <View style={styles.alarmMeta}>
                    <Text style={styles.alarmTarget}>🎯 Target: {alarm.target_count} reps</Text>
                  </View>
                </View>

                <View style={styles.alarmRight}>
                  {/* Test Alarm Button */}
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={() => triggerManualAlarmTest(alarm)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.testButtonText}>🔔 Test</Text>
                  </TouchableOpacity>

                  {/* Toggle */}
                  <Switch
                    value={alarm.is_active}
                    onValueChange={() => toggleReminder(alarm.id, alarm.is_active)}
                    trackColor={{ false: COLORS.backgroundElevated, true: COLORS.flamePrimary }}
                    thumbColor={alarm.is_active ? COLORS.white : COLORS.textMuted}
                  />

                  {/* Delete */}
                  <TouchableOpacity
                    style={styles.deleteAlarmBtn}
                    onPress={() => handleDelete(alarm.id, displayTime)}
                    activeOpacity={0.7}
                  >
                    <Icon name="trash" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Alarm Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeading}>SET PUSHUP ALARM</Text>
              <Text style={styles.modalSub}>Choose the hour, minute, and target reps</Text>

            {/* Time Picker Inputs */}
            <View style={styles.timeInputRow}>
              <View style={styles.timeInputBox}>
                <Text style={styles.timeInputLabel}>HOUR (0-23)</Text>
                <TextInput
                  style={styles.timeTextInput}
                  value={hour}
                  onChangeText={setHour}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="10"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <Text style={styles.colonText}>:</Text>

              <View style={styles.timeInputBox}>
                <Text style={styles.timeInputLabel}>MINUTE (0-59)</Text>
                <TextInput
                  style={styles.timeTextInput}
                  value={minute}
                  onChangeText={setMinute}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="30"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Target Reps */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TARGET PUSHUPS</Text>
              <TextInput
                style={styles.textInput}
                value={targetCount}
                onChangeText={setTargetCount}
                keyboardType="number-pad"
                placeholder="20"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Alarm Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ALARM TITLE</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Afternoon Energy Surge"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Modal Actions */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreate}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.createButtonText}>SET ALARM ⏰</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.flamePrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.flamePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.3)',
    marginBottom: 16,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 14,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.flameBright,
    letterSpacing: 1.2,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  alarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.flameGlow,
    marginBottom: 12,
  },
  alarmLeft: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  alarmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.flameBright,
    marginTop: 2,
  },
  alarmMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  alarmTarget: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  alarmRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: 'rgba(255, 214, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 0, 0.3)',
  },
  testButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.goldStreak,
  },
  deleteAlarmBtn: {
    padding: 8,
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.flamePrimary,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeInputBox: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  timeTextInput: {
    width: 80,
    height: 70,
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 16,
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.flamePrimary,
  },
  colonText: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.flameBright,
    marginHorizontal: 12,
    marginTop: 18,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  createButton: {
    backgroundColor: COLORS.flamePrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
