import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  ArrowLeft,
  Activity,
  AlertCircle,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';

const C = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  border: '#E5E5EC',
};

// Explicit dimensions keep the SVG from expanding the page layout.
const CampusIllustration = () => (
  <View
    style={styles.illustration}
    pointerEvents="none"
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <Svg width={280} height={164} viewBox="0 0 280 164">
      <Defs>
        <LinearGradient id="campusSky" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EAE3FF" />
          <Stop offset="1" stopColor="#DFF2E8" />
        </LinearGradient>
      </Defs>

      <Rect
        x={12}
        y={10}
        width={256}
        height={146}
        rx={60}
        fill="url(#campusSky)"
      />

      <Circle cx={211} cy={40} r={15} fill="#FFF6D6" />
      <Circle cx={48} cy={55} r={5} fill="#FFFFFF" />
      <Circle cx={240} cy={111} r={4} fill="#FFFFFF" />

      {/* Campus buildings */}
      <Rect x={62} y={77} width={48} height={63} rx={7} fill="#B7ABD9" />
      <Rect x={171} y={77} width={48} height={63} rx={7} fill="#B7ABD9" />

      <Rect x={101} y={57} width={79} height={83} rx={8} fill="#FFFEFB" />
      <Path d="M94 61 L140 30 L187 61 Z" fill="#7763A9" />

      <Circle cx={140} cy={69} r={9} fill="#EAE5F7" />
      <Path
        d="M140 63 V69 L144 72"
        stroke="#7763A9"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />

      <Rect x={116} y={88} width={12} height={15} rx={3} fill="#DDD7EC" />
      <Rect x={151} y={88} width={12} height={15} rx={3} fill="#DDD7EC" />
      <Rect x={130} y={116} width={20} height={24} rx={6} fill="#7763A9" />

      <Rect x={73} y={91} width={9} height={12} rx={2} fill="#F6F1FF" />
      <Rect x={89} y={91} width={9} height={12} rx={2} fill="#F6F1FF" />
      <Rect x={184} y={91} width={9} height={12} rx={2} fill="#F6F1FF" />
      <Rect x={200} y={91} width={9} height={12} rx={2} fill="#F6F1FF" />

      {/* Trees */}
      <Path
        d="M47 116 V140 M233 116 V140"
        stroke="#62947C"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Circle cx={47} cy={111} r={14} fill="#9BC9AE" />
      <Circle cx={233} cy={111} r={14} fill="#9BC9AE" />

      <Path
        d="M36 141 H246"
        stroke="#C2D9CB"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Small completion badge */}
      <Rect x={207} y={49} width={34} height={34} rx={12} fill="#FFFFFF" />
      <Path
        d="M216 66 L222 72 L232 60"
        stroke="#529576"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  </View>
);

export const AuthLayout = ({
  children,
  title,
  subtitle,
  registration = false,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.page,
          {
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom, 20) + 12,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageInner}>
          <View style={styles.topRow}>
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <Activity size={21} color={C.purple} strokeWidth={2} />
              </View>
              <Text style={styles.brandText}>campus pulse</Text>
            </View>

            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back to login"
              >
                <ArrowLeft size={20} color={C.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.communityDot} />
            )}
          </View>

          <View style={styles.hero}>
            <CampusIllustration />

            <View style={styles.heroTag}>
              <View style={styles.tagDot} />
              <Text style={styles.heroTagText}>
                {registration
                  ? 'SMALL ACTIONS. BETTER CAMPUS.'
                  : 'YOUR CAMPUS. YOUR COMMUNITY.'}
              </Text>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.formCard}>{children}</View>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              A better campus starts with us.
            </Text>
            <View style={styles.footerLine} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const AuthField = ({ label, icon: Icon, ...inputProps }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[styles.inputContainer, focused && styles.inputContainerFocused]}
      >
        <Icon
          size={19}
          color={focused ? C.purple : '#9494A2'}
          strokeWidth={1.7}
        />

        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          style={styles.input}
          placeholderTextColor="#A0A0AD"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
};

export const AuthError = ({ message }) =>
  message ? (
    <View style={styles.errorBox} accessibilityLiveRegion="polite">
      <AlertCircle size={17} color="#B64F62" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  ) : null;

export const AuthButton = ({ title, loading, onPress }) => (
  <TouchableOpacity
    style={[styles.button, loading && styles.buttonLoading]}
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ disabled: loading, busy: loading }}
  >
    {loading ? (
      <ActivityIndicator color="#FFFFFF" />
    ) : (
      <>
        <Text style={styles.buttonText}>{title}</Text>
        <View style={styles.buttonArrow}>
          <ArrowRight size={18} color="#FFFFFF" />
        </View>
      </>
    )}
  </TouchableOpacity>
);

export const AuthLink = ({ text, action, onPress }) => (
  <TouchableOpacity
    style={styles.linkButton}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
  >
    <Text style={styles.linkText}>
      {text} <Text style={styles.linkAction}>{action}</Text>
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  pageInner: {
    width: '100%',
    maxWidth: 440,
    flexGrow: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  brandIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#ECE7F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: C.text,
    flexShrink: 1,
  },
  communityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A3C7AC',
    margin: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F0EFEB',
    marginLeft: 10,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 26,
  },
  illustration: {
    width: '100%',
    height: 172,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#EEF2EA',
    borderRadius: 8,
    marginBottom: 15,
    maxWidth: '100%',
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#72957B',
    marginRight: 7,
  },
  heroTagText: {
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 1,
    fontWeight: '600',
    color: '#627967',
    flexShrink: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 33,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -1.2,
    textAlign: 'center',
    color: C.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 290,
  },
  formCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEBF0',
    shadowColor: '#353044',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.035,
    shadowRadius: 18,
    elevation: 2,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4E5061',
    marginBottom: 9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: '#FCFCFE',
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: '#AFA0DA',
    backgroundColor: '#FAF8FF',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 15,
    fontSize: 14,
    color: C.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#FFF1F3',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#A84154',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
  },
  button: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: C.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 17,
    marginTop: 2,
  },
  buttonLoading: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    paddingLeft: 30,
  },
  buttonArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    color: C.secondary,
  },
  linkAction: {
    color: C.purple,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    paddingHorizontal: 8,
  },
  footerLine: {
    height: 1,
    flex: 1,
    maxWidth: 28,
    backgroundColor: '#DEDFD9',
  },
  footerText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#888D84',
    textAlign: 'center',
    flexShrink: 1,
    marginHorizontal: 10,
  },
});
