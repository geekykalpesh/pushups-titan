import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ReminderProvider, useReminders } from './src/context/ReminderContext';
import { COLORS } from './src/theme/colors';
import { AuthScreen } from './src/screens/AuthScreen';
import { PinLockScreen } from './src/screens/PinLockScreen';
import { PushupsScreen } from './src/screens/PushupsScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AlarmsScreen } from './src/screens/AlarmsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AlarmNotificationModal } from './src/components/AlarmNotificationModal';
import { Icon, IconName } from './src/components/Icon';
import { SplashScreen } from './src/screens/SplashScreen';
import { playSound } from './src/utils/soundEffects';

type TabName = 'pushups' | 'eggs' | 'calendar' | 'analytics' | 'alarms' | 'profile';

interface TabItem {
  id: TabName;
  label: string;
  icon: IconName;
  activeColor: string;
}

const TABS: TabItem[] = [
  { id: 'pushups', label: 'Pushups', icon: 'pushup', activeColor: COLORS.flameBright },
  { id: 'eggs', label: 'Fuel', icon: 'egg', activeColor: COLORS.vitalityGreen },
  { id: 'calendar', label: 'Calendar', icon: 'calendar', activeColor: COLORS.cyanGlow },
  { id: 'analytics', label: 'Graphs', icon: 'chart', activeColor: COLORS.goldStreak },
  { id: 'alarms', label: 'Alarms', icon: 'alarm', activeColor: COLORS.urgentRed },
  { id: 'profile', label: 'Profile', icon: 'user', activeColor: COLORS.white },
];

const MainNavigator: React.FC = () => {
  const { user, isLoading, isPinLocked } = useAuth();
  const { activeAlarm, dismissAlarm, snoozeAlarm } = useReminders();
  const [currentTab, setCurrentTab] = useState<TabName>('pushups');
  const [splashFinished, setSplashFinished] = useState<boolean>(false);
  const handleSplashFinish = useCallback(() => {
    setSplashFinished(true);
  }, []);

  // Motivational Animated Splash Screen on app launch
  if (!splashFinished || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
        <SplashScreen onFinish={handleSplashFinish} isReady={!isLoading} />
      </View>
    );
  }

  // Not logged in -> Auth Screen
  if (!user && !isPinLocked) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <AuthScreen />
      </>
    );
  }

  // Locked with 4-Digit Passcode PIN or Biometric
  if (isPinLocked) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <PinLockScreen />
      </>
    );
  }

  // Active Screen Renderer
  const renderScreen = () => {
    switch (currentTab) {
      case 'pushups':
        return <PushupsScreen />;
      case 'eggs':
        return <NutritionScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'alarms':
        return <AlarmsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <PushupsScreen />;
    }
  };

  const handleAlarmAccept = () => {
    dismissAlarm();
    setCurrentTab('pushups');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Screen Body */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              onPress={() => {
                playSound('tap');
                setCurrentTab(tab.id);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  isActive && {
                    backgroundColor: 'rgba(255, 87, 34, 0.12)',
                    borderColor: tab.activeColor,
                  },
                ]}
              >
                <Icon name={tab.icon} size={20} color={isActive ? tab.activeColor : COLORS.textMuted} />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? tab.activeColor : COLORS.textMuted },
                  isActive && { fontWeight: '900' },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Global In-App Alarm Popup */}
      <AlarmNotificationModal
        alarm={activeAlarm}
        onAccept={handleAlarmAccept}
        onSnooze={() => snoozeAlarm(5)}
        onDismiss={dismissAlarm}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ReminderProvider>
          <MainNavigator />
        </ReminderProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  splashLogo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.flamePrimary,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  splashSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
  },
});
