import React, { useContext, useState, useEffect } from 'react';
import { API_URL as BASE_API_URL } from '../../config';
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
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';

import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';

const API_URL = `${BASE_API_URL}/auth`;

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

const ProfileBackground = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        setSize(prev =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="profileBackground" x1="0%" y1="0%" x2="90%" y2="100%">
              <Stop offset="0%" stopColor="#EEE7F8" />
              <Stop offset="45%" stopColor="#FAFAF7" />
              <Stop offset="75%" stopColor="#FAFAF7" />
              <Stop offset="100%" stopColor="#EAF2E7" />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill="url(#profileBackground)" />
        </Svg>
      )}
    </View>
  );
};

const ProfileField = ({ label, icon: Icon, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <Icon size={19} color={focused ? C.purple : '#898693'} strokeWidth={1.6} />
        <TextInput
          {...props}
          style={styles.input}
          placeholderTextColor="#8C8C98"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
};

const AdminProfile = ({ navigation }) => {
  const { userData, userToken, logout, login } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const [name, setName] = useState(userData?.name || '');
  const [profilePhoto, setProfilePhoto] = useState(userData?.profilePhoto || null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name);
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
      showAlert('Success', 'Admin profile updated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Error', error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayPhoto = selectedImage ? selectedImage.uri : profilePhoto;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ProfileBackground />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>ADMIN PROFILE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.page}>
          
          <View style={styles.intro}>
            <Text style={styles.heading}>Your Profile</Text>
            <Text style={styles.subtitle}>Manage your admin account.</Text>
          </View>

          <View style={styles.identity}>
            <View style={styles.portraitComposition}>
              <View pointerEvents="none" style={styles.portraitMint} />
              <View pointerEvents="none" style={styles.portraitLavender} />

              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.portraitButton}
                activeOpacity={0.8}
              >
                {displayPhoto ? (
                  <Image source={{ uri: displayPhoto }} style={styles.portrait} resizeMode="cover" />
                ) : (
                  <View style={[styles.portrait, styles.placeholder]}>
                    <Text style={styles.initial}>{name?.charAt(0)?.toUpperCase() || 'A'}</Text>
                  </View>
                )}
                <View style={styles.cameraButton}>
                  <Camera size={17} color="#FFFFFF" strokeWidth={1.8} />
                </View>
              </TouchableOpacity>
              <View pointerEvents="none" style={styles.portraitDot} />
            </View>

            <Text style={styles.photoHint}>
              {selectedImage ? 'New photo selected · save to apply' : 'Tap your photo to change it'}
            </Text>

            <Text style={styles.displayName}>{name || 'Admin'}</Text>
            
            <View style={styles.identityMeta}>
              <View style={styles.registrationBlock}>
                <Text style={styles.metaLabel}>LOGIN ID</Text>
                <Text style={styles.registrationNumber}>{userData?.registrationNumber || 'ADMIN'}</Text>
              </View>
              <View style={styles.roleBadge}>
                <View style={styles.roleDot} />
                <Text style={styles.roleText}>ADMIN</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <ProfileField
            label="Full name"
            icon={User}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.savingButton]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
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

          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
            <View style={styles.logoutIcon}>
              <LogOut size={19} color="#A15C68" strokeWidth={1.7} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.logoutText}>Logout</Text>
              <Text style={styles.logoutHint}>Sign out of your admin account.</Text>
            </View>
            <ArrowRight size={17} color="#A78B91" />
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>A better campus starts with us.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.secondary,
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 40 },
  page: { width: '100%', maxWidth: 480 },

  intro: { paddingTop: 10 },
  heading: { fontSize: 30, lineHeight: 38, fontWeight: '600', letterSpacing: -1, color: C.text },
  subtitle: { fontSize: 12, lineHeight: 20, color: C.secondary, marginTop: 7 },

  identity: { alignItems: 'center', paddingTop: 26 },
  portraitComposition: { width: 162, height: 151, justifyContent: 'center', alignItems: 'center' },
  portraitMint: {
    position: 'absolute', width: 110, height: 116, right: 7, top: 22,
    borderRadius: 29, backgroundColor: '#DFEBD9', transform: [{ rotate: '11deg' }],
  },
  portraitLavender: {
    position: 'absolute', width: 110, height: 116, left: 10, top: 10,
    borderRadius: 29, backgroundColor: '#E4DCEE', transform: [{ rotate: '-10deg' }],
  },
  portraitButton: { width: 112, height: 116, borderRadius: 27, backgroundColor: '#FFFFFF', padding: 4 },
  portrait: { width: '100%', height: '100%', borderRadius: 23, backgroundColor: C.lavender },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  initial: { fontSize: 42, fontWeight: '500', color: C.purple },
  cameraButton: {
    position: 'absolute', right: -8, bottom: -5, width: 36, height: 36,
    borderRadius: 13, backgroundColor: C.purple, borderWidth: 3, borderColor: '#FAFAF7',
    alignItems: 'center', justifyContent: 'center',
  },
  portraitDot: {
    position: 'absolute', left: 15, bottom: 0, width: 7, height: 7,
    borderRadius: 4, backgroundColor: '#CBB58F',
  },
  photoHint: { fontSize: 10, lineHeight: 17, color: C.secondary, textAlign: 'center', marginTop: 12 },
  displayName: { fontSize: 23, lineHeight: 30, fontWeight: '600', letterSpacing: -0.6, textAlign: 'center', color: C.text, marginTop: 19 },
  
  identityMeta: {
    width: '100%', flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', alignItems: 'center', marginTop: 25, gap: 16
  },
  registrationBlock: { alignItems: 'center' },
  metaLabel: { fontSize: 8, letterSpacing: 1.3, color: C.secondary, marginBottom: 6 },
  registrationNumber: { fontSize: 14, fontWeight: '500', color: C.text, letterSpacing: 0.5 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.mint,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
  },
  roleDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#78977A', marginRight: 6 },
  roleText: { fontSize: 9, fontWeight: '500', letterSpacing: 0.6, color: C.green },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 27 },

  field: { marginBottom: 23 },
  label: { fontSize: 12, fontWeight: '500', color: '#555563', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 52,
    borderBottomWidth: 1, borderBottomColor: '#D8D4E0', paddingHorizontal: 2,
  },
  inputRowFocused: { borderBottomColor: C.purple, backgroundColor: 'rgba(238,231,247,0.35)' },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: C.text, paddingVertical: 14, paddingHorizontal: 11 },
  
  saveButton: {
    flexDirection: 'row', minHeight: 53, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.purple, marginTop: 3,
  },
  savingButton: { opacity: 0.75 },
  saveButtonText: { flex: 1, textAlign: 'center', paddingLeft: 30, color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  saveArrow: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  logoutButton: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  logoutIcon: {
    width: 39, height: 39, borderRadius: 13, backgroundColor: '#F4E9EA',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  logoutText: { fontSize: 13, fontWeight: '500', color: '#995765' },
  logoutHint: { fontSize: 11, lineHeight: 18, color: C.secondary, marginTop: 4, paddingRight: 10 },
  
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  footerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#A2C2AB', marginRight: 9 },
  footerText: { fontSize: 9, color: '#9DA199', letterSpacing: 0.5 },
});

export default AdminProfile;
