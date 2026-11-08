import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { Icon } from '../components/Icon';

interface PrivacyPolicyScreenProps {
  onClose?: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onClose }) => {
  const handleOpenEmail = () => {
    Linking.openURL('mailto:geekykalpesh@gmail.com?subject=Pushup Titan Privacy Inquiry');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-left" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>PRIVACY POLICY</Text>
          <Text style={styles.headerSubtitle}>Pushup Titan • GeekyKalpesh</Text>
        </View>
        {onClose && <View style={styles.placeholder} />}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>EFFECTIVE DATE: NOVEMBER 2026</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(57, 211, 83, 0.15)' }]}>
            <Text style={[styles.badgeText, { color: COLORS.vitalityGreen }]}>GDPR & CCPA COMPLIANT</Text>
          </View>
        </View>

        {/* Section 1 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>1. Overview & Commitment</Text>
          <Text style={styles.bodyText}>
            Welcome to <Text style={styles.highlight}>Pushup Titan</Text>, developed and published by{' '}
            <Text style={styles.highlight}>GeekyKalpesh</Text> ("we", "our", or "us"). We are dedicated
            to protecting your personal privacy while providing a world-class workout and nutrition
            tracking experience.
          </Text>
          <Text style={styles.bodyText}>
            This Privacy Policy explains how we collect, store, protect, and handle your data when you
            use our mobile application and related cloud services.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>2. Information We Collect</Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.subHighlight}>Account Information:</Text> When you register, we collect
            your chosen username, email address, and an irreversibly hashed password (using industry-standard
            bcrypt encryption). If you configure a 4-digit passcode, it is also salted and cryptographically
            hashed before storage.
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.subHighlight}>Fitness & Workout Logs:</Text> Number of pushups completed,
            repetition counts, session dates/times, personal bests, and workout streak data.
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.subHighlight}>Nutrition Tracking:</Text> Egg consumption logs, calculated
            protein estimates, and daily benchmark goals that you voluntarily enter.
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.subHighlight}>Device Telemetry:</Text> Minimal technical information required
            for API communication, network connectivity status, and crash prevention. We do <Text style={styles.highlight}>NOT</Text>
            collect precise GPS location or intrusive device identifiers.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>3. How We Use Your Data</Text>
          <Text style={styles.bulletItem}>• To calculate and display your personal progress, heatmaps, and stats.</Text>
          <Text style={styles.bulletItem}>• To synchronize your workout logs across devices securely.</Text>
          <Text style={styles.bulletItem}>• To trigger custom daily reminders and motivational alarms that you set.</Text>
          <Text style={styles.bulletItem}>• We never sell, rent, or trade your personal information to third-party advertisers or data brokers.</Text>
        </View>

        {/* Section 4 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>4. Data Security & Storage</Text>
          <Text style={styles.bodyText}>
            Your fitness records are transmitted via SSL/TLS encryption and stored on enterprise-grade
            cloud PostgreSQL infrastructure (Neon Cloud) protected by strict firewall policies. Sensitive
            credentials such as passwords and PINs are protected with one-way cryptographic hashing and
            are never stored in plain text.
          </Text>
        </View>

        {/* Section 5 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>5. User Rights & Account Deletion</Text>
          <Text style={styles.bodyText}>
            In compliance with Google Play Store Developer Guidelines and global privacy laws:
          </Text>
          <Text style={styles.bulletItem}>
            • You have the right to access, export, or modify your personal logs at any time.
          </Text>
          <Text style={styles.bulletItem}>
            • <Text style={styles.highlight}>Account Deletion:</Text> You can request complete deletion
            of your account and all associated fitness logs by contacting our support team or sending
            an email directly to{' '}
            <Text style={styles.linkText} onPress={handleOpenEmail}>
              geekykalpesh@gmail.com
            </Text>
            . Upon confirmation, all your data will be permanently purged within 30 days.
          </Text>
        </View>

        {/* Section 6 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>6. Health & Fitness Disclaimer</Text>
          <Text style={styles.bodyText}>
            Pushup Titan is designed solely as a fitness log and habit tracking tool. It does not provide
            medical advice, clinical diagnosis, or medical treatment. Always consult with a qualified
            healthcare provider before starting any rigorous physical exercise program.
          </Text>
        </View>

        {/* Section 7 */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>7. Developer Contact</Text>
          <Text style={styles.bodyText}>
            If you have questions, feedback, or data privacy requests regarding Pushup Titan, contact:
          </Text>
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>GeekyKalpesh Developer Studio</Text>
            <Text style={styles.contactEmail}>Email: geekykalpesh@gmail.com</Text>
            <Text style={styles.contactEmail}>Website: https://geekykalpesh.com</Text>
          </View>
        </View>

        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeBtnText}>CLOSE PRIVACY POLICY</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.backgroundElevated,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.flameBright,
    fontWeight: '600',
    marginTop: 2,
  },
  placeholder: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.3)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.flameBright,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  highlight: {
    color: COLORS.white,
    fontWeight: '700',
  },
  subHighlight: {
    color: COLORS.flameBright,
    fontWeight: '700',
  },
  linkText: {
    color: COLORS.cyanGlow,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  contactBox: {
    backgroundColor: COLORS.backgroundElevated,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  closeBtn: {
    backgroundColor: COLORS.flamePrimary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
