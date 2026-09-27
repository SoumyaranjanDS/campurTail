import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import {
  Camera,
  LogOut,
  Activity,
  User,
  BookOpen,
  ArrowRight,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';

import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import Screen from '../components/Screen';

const API_URL = 'https://tails.inkedfact.online/api/v1/auth';

const C = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  lavender: '#EEE7F7',
  mint: '#E7F0E5',
  green: '#587B61',
  border: '#E1DFE7',
};

// Explicit measured dimensions avoid SVG layout expansion.
const ProfileBackground = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;

        setSize(previous =>
          previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFillObject}
        >
          <Defs>
            <LinearGradient
              id="profileBackground"
              x1="0%"
              y1="0%"
              x2="90%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#EEE7F8" />
              <Stop offset="45%" stopColor="#FAFAF7" />
              <Stop offset="75%" stopColor="#FAFAF7" />
              <Stop offset="100%" stopColor="#EAF2E7" />
            </LinearGradient>
          </Defs>

          <Rect
            width={size.width}
            height={size.height}
            fill="url(#profileBackground)"
          />
        </Svg>
      )}
    </View>
  );
};

const CampusMark = () => (
  <View
    pointerEvents="none"
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <Svg width={58} height={58} viewBox="0 0 58 58">
      <Circle cx={29} cy={29} r={26} fill="#E8EFDF" />
      <Path d="M11 26L29 12L47 26Z" fill="#A79ABD" />
      <Rect x={16} y={25} width={26} height={21} rx={2} fill="#C7BCD8" />
      <Rect x={21} y={30} width={5} height={6} rx={1} fill="#FAFAF7" />
      <Rect x={32} y={30} width={5} height={6} rx={1} fill="#FAFAF7" />
      <Rect x={26} y={38} width={6} height={8} rx={1} fill="#8E7DA9" />
      <Path
        d="M11 47H47"
        stroke="#A6B99E"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

const ProfileField = ({ label, icon: Icon, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
        ]}
      >
        <Icon
          size={19}
          color={focused ? C.purple : '#898693'}
          strokeWidth={1.6}
        />

        <TextInput
          {...props}
          style={styles.input}
          placeholderTextColor="#8C8C98"
          accessibilityLabel={label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
};

const ProfileScreen = () => {
  const { userData, userToken, logout, login } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const [name, setName] = useState(userData?.name || '');
  const [branch, setBranch] = useState(userData?.branch || '');
  const [profilePhoto, setProfilePhoto] = useState(
    userData?.profilePhoto || null,
  );

  const [selectedImage, setSelectedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if userData changes.
  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setBranch(userData.branch);
      setProfilePhoto(userData.profilePhoto);
    }
  }, [userData]);

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;

      if (response.errorMessage) {
        showAlert('Error', response.errorMessage, 'error');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0]);
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('branch', branch);

      if (selectedImage) {
        formData.append('profilePhoto', {
          uri: selectedImage.uri,
          type: selectedImage.type,
          name: selectedImage.fileName || 'profile.jpg',
        });
      }

      const response = await axios.patch(`${API_URL}/me`, formData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      login(userToken, response.data);
      setSelectedImage(null);
      showAlert('Success', 'Profile updated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showAlert(
        'Error',
        error.response?.data?.message || 'Failed to update profile.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const displayPhoto = selectedImage ? selectedImage.uri : profilePhoto;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ProfileBackground />

        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Activity size={21} color={C.purple} strokeWidth={1.8} />
            </View>
            <Text style={styles.brandText}>campus pulse</Text>
          </View>

          <Text style={styles.headerLabel}>YOUR SPACE</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.page}>
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>THE PERSON BEHIND THE PULSE</Text>
              <Text style={styles.heading}>
                A little about you.
              </Text>
              <Text style={styles.subtitle}>
                Your place in our campus community.
              </Text>
            </View>

            {/* Portrait with soft, layered paper shapes */}
            <View style={styles.identity}>
              <View style={styles.portraitComposition}>
                <View
                  pointerEvents="none"
                  style={styles.portraitMint}
                />
                <View
                  pointerEvents="none"
                  style={styles.portraitLavender}
                />

                <TouchableOpacity
                  onPress={handlePickImage}
                  style={styles.portraitButton}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  {displayPhoto ? (
                    <Image
                      source={{ uri: displayPhoto }}
                      style={styles.portrait}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.portrait, styles.placeholder]}>
                      <Text style={styles.initial}>
                        {name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cameraButton}>
                    <Camera size={17} color="#FFFFFF" strokeWidth={1.8} />
                  </View>
                </TouchableOpacity>

                <View pointerEvents="none" style={styles.portraitDot} />
              </View>

              <Text style={styles.photoHint}>
                {selectedImage
                  ? 'New photo selected · save to apply'
                  : 'Tap your photo to change it'}
              </Text>

              <Text style={styles.displayName}>
                {name || 'Your name'}
              </Text>

              {branch ? (
                <Text style={styles.displayBranch}>{branch}</Text>
              ) : null}

              <View style={styles.identityMeta}>
                <View style={styles.registrationBlock}>
                  <Text style={styles.metaLabel}>REGISTRATION NO.</Text>
                  <Text style={styles.registrationNumber}>
                    {userData?.registrationNumber}
                  </Text>
                </View>

                {userData?.role ? (
                  <View style={styles.roleBadge}>
                    <View style={styles.roleDot} />
                    <Text style={styles.roleText}>
                      {userData.role.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Open form */}
            <View style={styles.sectionHeading}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>01</Text>
              </View>

              <View style={styles.flex}>
                <Text style={styles.sectionTitle}>Your details</Text>
                <Text style={styles.sectionSubtitle}>
                  Keep your campus profile up to date.
                </Text>
              </View>

              <CampusMark />
            </View>

            <ProfileField
              label="Full name"
              icon={User}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />

            <ProfileField
              label="Branch"
              icon={BookOpen}
              value={branch}
              onChangeText={setBranch}
              placeholder="e.g. Computer Science"
            />

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.savingButton]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Save Changes"
              accessibilityState={{
                disabled: isSaving,
                busy: isSaving,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                  <View style={styles.saveArrow}>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </View>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Account action */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <View style={styles.logoutIcon}>
                <LogOut size={19} color="#A15C68" strokeWidth={1.7} />
              </View>

              <View style={styles.flex}>
                <Text style={styles.logoutText}>Logout</Text>
                <Text style={styles.logoutHint}>
                  Sign out of your campus account.
                </Text>
              </View>

              <ArrowRight size={17} color="#A78B91" />
            </TouchableOpacity>

            <View style={styles.footer}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>
                A better campus starts with us.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  brandIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: C.text,
    flexShrink: 1,
  },
  headerLabel: {
    fontSize: 8,
    letterSpacing: 1.4,
    color: '#7D7887',
    marginLeft: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  page: {
    width: '100%',
    maxWidth: 480,
  },

  intro: {
    paddingTop: 15,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 1.3,
    color: '#84758F',
    marginBottom: 9,
  },
  heading: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -1,
    color: C.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    marginTop: 7,
  },

  identity: {
    alignItems: 'center',
    paddingTop: 26,
  },
  portraitComposition: {
    width: 162,
    height: 151,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitMint: {
    position: 'absolute',
    width: 110,
    height: 116,
    right: 7,
    top: 22,
    borderRadius: 29,
    backgroundColor: '#DFEBD9',
    transform: [{ rotate: '11deg' }],
  },
  portraitLavender: {
    position: 'absolute',
    width: 110,
    height: 116,
    left: 10,
    top: 10,
    borderRadius: 29,
    backgroundColor: '#E4DCEE',
    transform: [{ rotate: '-10deg' }],
  },
  portraitButton: {
    width: 112,
    height: 116,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    padding: 4,
  },
  portrait: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    backgroundColor: C.lavender,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    fontSize: 42,
    fontWeight: '500',
    color: C.purple,
  },
  cameraButton: {
    position: 'absolute',
    right: -8,
    bottom: -5,
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: C.purple,
    borderWidth: 3,
    borderColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitDot: {
    position: 'absolute',
    left: 15,
    bottom: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CBB58F',
  },
  photoHint: {
    fontSize: 10,
    lineHeight: 17,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 12,
  },
  displayName: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.6,
    textAlign: 'center',
    color: C.text,
    marginTop: 19,
  },
  displayBranch: {
    fontSize: 12,
    lineHeight: 19,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 5,
  },
  identityMeta: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
  },
  registrationBlock: {
    flexShrink: 1,
    marginRight: 12,
    marginVertical: 5,
  },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 1.3,
    color: C.secondary,
    marginBottom: 6,
  },
  registrationNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
    letterSpacing: 0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.mint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 5,
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#78977A',
    marginRight: 6,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: C.green,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 27,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  sectionNumber: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  sectionNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.purple,
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 18,
    color: C.secondary,
    marginTop: 4,
    paddingRight: 6,
  },

  field: {
    marginBottom: 23,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555563',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D4E0',
    paddingHorizontal: 2,
  },
  inputRowFocused: {
    borderBottomColor: C.purple,
    backgroundColor: 'rgba(238,231,247,0.35)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: C.text,
    paddingVertical: 14,
    paddingHorizontal: 11,
  },
  saveButton: {
    flexDirection: 'row',
    minHeight: 53,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.purple,
    marginTop: 3,
  },
  savingButton: {
    opacity: 0.75,
  },
  saveButtonText: {
    flex: 1,
    textAlign: 'center',
    paddingLeft: 30,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  logoutIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#F4E9EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#995765',
  },
  logoutHint: {
    fontSize: 11,
    lineHeight: 18,
    color: C.secondary,
    marginTop: 4,
    paddingRight: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9CB49A',
    marginRight: 7,
  },
  footerText: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 17,
    color: '#778173',
    textAlign: 'center',
  },
});

export default ProfileScreen;
