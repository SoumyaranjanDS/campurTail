import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
  Vibration,
  KeyboardAvoidingView,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  Activity,
  MapPin,
  Camera,
  Image as ImageIcon,
  Wand2,
  ArrowRight,
  CheckCircle,
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
import FullScreenLoader from '../components/FullScreenLoader';
import Screen from '../components/Screen';

const API_URL = 'https://tails.inkedfact.online/api/v1/incidents';

const CATEGORIES = [
  'Infrastructure',
  'Academics',
  'Hostel',
  'Cleanliness',
  'Security',
  'Other',
];

const C = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  lavender: '#EEE7F7',
  mint: '#E7F0E5',
  green: '#507B60',
  border: '#DFDCE6',
};

const PRIORITY_COLORS = {
  Low: '#60816A',
  Medium: '#987A40',
  High: '#AE7145',
  Critical: '#B24D62',
};

const ReportBackground = () => {
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
              id="reportFormBackground"
              x1="0%"
              y1="0%"
              x2="90%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#EEE8F8" />
              <Stop offset="40%" stopColor="#FAFAF7" />
              <Stop offset="75%" stopColor="#FAFAF7" />
              <Stop offset="100%" stopColor="#EAF2E7" />
            </LinearGradient>
          </Defs>
          <Rect
            width={size.width}
            height={size.height}
            fill="url(#reportFormBackground)"
          />
        </Svg>
      )}
    </View>
  );
};

const CameraIllustration = () => (
  <View
    pointerEvents="none"
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <Svg width={126} height={104} viewBox="0 0 126 104">
      <Circle cx={65} cy={53} r={43} fill="#E4EDDE" />

      <Rect
        x={18}
        y={29}
        width={77}
        height={57}
        rx={13}
        fill="#D9CDEB"
        transform="rotate(-9 56 57)"
      />

      <Path d="M40 30L46 20H72L79 30" fill="#A997BF" />
      <Rect x={30} y={30} width={78} height={53} rx={12} fill="#A997BF" />
      <Rect x={35} y={36} width={68} height={41} rx={9} fill="#F7F3FD" />

      <Circle cx={68} cy={56} r={16} fill="#D9CDEB" />
      <Circle cx={68} cy={56} r={10} fill="#8C79AB" />
      <Circle cx={65} cy={53} r={3} fill="#F7F3FD" />

      <Rect x={88} y={42} width={8} height={4} rx={2} fill="#B8A7CC" />

      <Path
        d="M104 13V23M99 18H109"
        stroke="#A1B493"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={18} cy={83} r={4} fill="#CDBA99" />
    </Svg>
  </View>
);

const StepHeading = ({ number, title, subtitle }) => (
  <View style={styles.stepHeading}>
    <View style={styles.stepMarker}>
      <Text style={styles.stepNumber}>{number}</Text>
    </View>

    <View style={styles.flex}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

const ExploreScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState('Medium');
  const [location, setLocation] = useState('');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Load local draft.
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draftStr = await AsyncStorage.getItem('@report_draft');

        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft.title) setTitle(draft.title);
          if (draft.description) setDescription(draft.description);
          if (draft.category) setCategory(draft.category);
          if (draft.priority) setPriority(draft.priority);
          if (draft.location) setLocation(draft.location);
          if (draft.photo) setPhoto(draft.photo);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      } finally {
        setIsDraftLoaded(true);
      }
    };

    loadDraft();
  }, []);

  // Save local draft automatically.
  useEffect(() => {
    if (!isDraftLoaded) return;

    const saveDraft = async () => {
      try {
        const draft = {
          title,
          description,
          category,
          priority,
          location,
          photo,
        };

        if (title || description || location || photo) {
          await AsyncStorage.setItem('@report_draft', JSON.stringify(draft));
        } else {
          await AsyncStorage.removeItem('@report_draft');
        }
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    };

    const timeoutId = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timeoutId);
  }, [title, description, category, priority, location, photo, isDraftLoaded]);

  const handleClearDraft = async () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setCategory(CATEGORIES[0]);
    setPriority('Medium');
    setPhoto(null);
    setGpsLocation(null);
    await AsyncStorage.removeItem('@report_draft');
  };

  const analyzeImageWithAI = async base64Image => {
    setIsAnalyzing(true);

    try {
      const response = await axios.post(
        `${API_URL}/analyze-image`,
        { base64Image },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );

      const {
        title: aiTitle,
        description: aiDesc,
        category: aiCat,
        priority: aiPriority,
      } = response.data;

      if (aiTitle) setTitle(aiTitle);
      if (aiDesc) setDescription(aiDesc);
      if (aiCat && CATEGORIES.includes(aiCat)) setCategory(aiCat);
      if (aiPriority) setPriority(aiPriority);

      Vibration.vibrate(100);

      showAlert(
        'AI Analysis Complete',
        'Form auto-filled based on your photo!',
      );
    } catch (error) {
      console.error(error);
      showAlert(
        'AI Analysis Failed',
        'Could not auto-fill form. Please enter details manually.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePickImage = async source => {
    if (source === 'camera' && Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'Campus Pulse needs access to your camera to take photos of incidents.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showAlert(
            'Permission Denied',
            'Camera permission is required to take photos.',
          );
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.7,
      includeBase64: true,
      maxWidth: 800,
      maxHeight: 800,
    };

    const callback = response => {
      if (response.didCancel) return;

      if (response.errorMessage) {
        showAlert('Error', response.errorMessage, 'error');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const selectedPhoto = response.assets[0];
        setPhoto(selectedPhoto);

        if (selectedPhoto.base64) {
          analyzeImageWithAI(selectedPhoto.base64);
        }
      }
    };

    if (source === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  };

  const handleGetLocation = async () => {
    setIsLocating(true);

    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      showAlert(
        'Permission Denied',
        'Location permission is required to get GPS coordinates.',
      );
      setIsLocating(false);
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        
        // Auto-fill the location text input if it's empty
        setLocation(prev => 
          prev.trim() === '' 
            ? `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
            : prev
        );
        
        setIsLocating(false);
      },
      error => {
        showAlert(
          'Error',
          'Could not fetch location. Please try again or type it manually.',
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleSubmit = async () => {
    if (!title || !location || !photo) {
      showAlert(
        'Missing Fields',
        'Please fill out all required fields and add a photo.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('location', location);
      formData.append('priority', priority);

      if (gpsLocation) {
        formData.append('latitude', gpsLocation.latitude.toString());
        formData.append('longitude', gpsLocation.longitude.toString());
      }

      formData.append('photo', {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName || 'incident.jpg',
      });

      await axios.post(API_URL, formData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      showAlert('Success', 'Issue reported successfully!', 'success');

      setTitle('');
      setDescription('');
      setLocation('');
      setGpsLocation(null);
      setPhoto(null);
      setCategory(CATEGORIES[0]);
      setPriority('Medium');

      await AsyncStorage.removeItem('@report_draft');

      navigation.navigate('Home');
    } catch (error) {
      console.error(error);
      showAlert(
        'Error',
        error.response?.data?.message || 'Failed to submit report.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ReportBackground />

        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Activity size={21} color={C.purple} strokeWidth={1.8} />
            </View>
            <Text style={styles.brandText}>campus pulse</Text>
          </View>
          <Text style={styles.headerLabel}>NEW REPORT</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.page}>
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>SMALL ACTIONS. BETTER CAMPUS.</Text>
              <Text style={styles.heading}>
                Notice something?{'\n'}Let’s start here.
              </Text>
              <Text style={styles.subtitle}>
                A photo, a few details, and the right location.
              </Text>
            </View>

            {/* 01 — Capture */}
            <StepHeading
              number="01"
              title="Show us the scene"
              subtitle="Add a photo of the issue. Required."
            />

            {!photo ? (
              <View style={styles.uploadArea}>
                <CameraIllustration />

                <Text style={styles.uploadTitle}>One photo tells a lot.</Text>
                <Text style={styles.uploadSubtitle}>
                  Take a clear picture or choose one from your gallery.
                </Text>

                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.cameraAction}
                    onPress={() => handlePickImage('camera')}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <Camera size={18} color="#FFFFFF" />
                    <Text style={styles.cameraActionText}>Take photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.galleryAction}
                    onPress={() => handlePickImage('library')}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <ImageIcon size={18} color={C.purple} />
                    <Text style={styles.galleryActionText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.previewSection}>
                <View style={styles.photoFrame}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />

                  <View pointerEvents="none" style={styles.photoTape} />

                  {isAnalyzing ? (
                    <View style={styles.analyzingOverlay}>
                      <ActivityIndicator color="#FFFFFF" />
                      <Text style={styles.analyzingText}>
                        Looking at your photo…
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.photoCaption}>
                  <View style={styles.photoAttached}>
                    <CheckCircle size={14} color={C.green} />
                    <Text style={styles.photoAttachedText}>Photo attached</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setPhoto(null)}
                    disabled={isAnalyzing}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.aiNote}>
              <Wand2 size={17} color={C.purple} />
              <Text style={styles.aiNoteText}>
                AI can suggest a title, category, description, and priority.
                Review the details before submitting.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* 02 — Describe */}
            <StepHeading
              number="02"
              title="Tell us what happened"
              subtitle="A little context goes a long way."
            />

            <Text style={styles.label}>
              Issue title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Broken projector in Room 302"
              placeholderTextColor="#8B8794"
              value={title}
              onChangeText={setTitle}
              accessibilityLabel="Issue title, required"
            />

            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.categoryWrap}>
              {CATEGORIES.map(cat => {
                const selected = category === cat;

                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryOption,
                      selected && styles.categoryOptionSelected,
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        selected && styles.categoryDotSelected,
                      ]}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selected && styles.categoryTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Priority</Text>
              <Text style={styles.readOnlyLabel}>Read-only · AI assisted</Text>
            </View>

            <View style={styles.priorityRow}>
              {['Low', 'Medium', 'High', 'Critical'].map(level => {
                const selected = priority === level;
                const color = PRIORITY_COLORS[level];

                return (
                  <View
                    key={level}
                    style={styles.priorityItem}
                    accessible
                    accessibilityLabel={`${level}${
                      selected ? ', selected priority' : ''
                    }`}
                  >
                    <View
                      style={[
                        styles.priorityBar,
                        {
                          backgroundColor: selected ? color : '#E3DFE8',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        selected && { color, fontWeight: '600' },
                      ]}
                    >
                      {level}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.fieldHelp}>
              Starts at Medium; photo analysis may update it.
            </Text>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.optionalLabel}>Optional</Text>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What’s happening? Add anything that could help."
              placeholderTextColor="#8B8794"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Description, optional"
            />

            <View style={styles.divider} />

            {/* 03 — Locate */}
            <StepHeading
              number="03"
              title="Mark the spot"
              subtitle="Help the right people find the issue."
            />

            <Text style={styles.label}>
              Location details <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.locationInputRow}>
              <MapPin size={18} color={C.purple} strokeWidth={1.7} />
              <TextInput
                style={styles.locationInput}
                placeholder="Building, floor, room or landmark"
                placeholderTextColor="#8B8794"
                value={location}
                onChangeText={setLocation}
                accessibilityLabel="Location details, required"
              />
            </View>

            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleGetLocation}
              disabled={isLocating}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Capture current GPS coordinates"
            >
              {isLocating ? (
                <ActivityIndicator color={C.purple} size="small" />
              ) : (
                <MapPin size={17} color={C.purple} />
              )}

              <Text style={styles.gpsButtonText}>
                {isLocating
                  ? 'Finding your location…'
                  : gpsLocation
                  ? 'Refresh GPS coordinates'
                  : 'Add current GPS coordinates'}
              </Text>

              <Text style={styles.gpsOptional}>Optional</Text>
            </TouchableOpacity>

            {gpsLocation ? (
              <View style={styles.gpsResult}>
                <CheckCircle size={15} color={C.green} />
                <Text style={styles.gpsResultText}>
                  GPS captured: {gpsLocation.latitude.toFixed(4)},{' '}
                  {gpsLocation.longitude.toFixed(4)}
                </Text>
              </View>
            ) : null}

            <Text style={styles.locationHelp}>
              GPS adds coordinates. Please still enter the building or room
              above.
            </Text>

            <View style={styles.divider} />

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearDraft}
                disabled={isSubmitting}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.dimmed]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Submit Report</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
              A better campus starts with one report.
            </Text>
          </View>
        </ScrollView>

        <FullScreenLoader
          visible={isAnalyzing || isSubmitting}
          text={isAnalyzing ? 'AI SCANNING...' : 'SUBMITTING...'}
        />
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
    alignItems: 'center',
    justifyContent: 'center',
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
    letterSpacing: 1.3,
    color: '#7D7887',
    marginLeft: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  page: {
    width: '100%',
    maxWidth: 520,
  },
  intro: {
    paddingTop: 15,
    paddingBottom: 28,
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 15,
    letterSpacing: 1.3,
    color: '#84758F',
    marginBottom: 10,
  },
  heading: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.9,
    color: C.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    marginTop: 10,
  },

  stepHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepMarker: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: C.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: C.purple,
  },
  stepTitle: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: C.text,
  },
  stepSubtitle: {
    fontSize: 11,
    lineHeight: 18,
    color: C.secondary,
    marginTop: 3,
  },

  uploadArea: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
  },
  uploadTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: C.text,
    marginTop: 10,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 7,
  },
  photoActions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 21,
  },
  cameraAction: {
    flex: 1,
    minHeight: 48,
    padding: 12,
    borderRadius: 13,
    backgroundColor: C.purple,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cameraActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
    flexShrink: 1,
  },
  galleryAction: {
    flex: 1,
    minHeight: 48,
    padding: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D9CFE5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.purple,
    marginLeft: 8,
    flexShrink: 1,
  },

  previewSection: {
    marginTop: 6,
  },
  photoFrame: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 5,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 3,
    backgroundColor: '#E9E5ED',
  },
  photoTape: {
    position: 'absolute',
    top: -7,
    left: 19,
    width: 60,
    height: 16,
    backgroundColor: 'rgba(215,203,232,0.8)',
    transform: [{ rotate: '-7deg' }],
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(48,39,66,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 10,
  },
  photoCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  photoAttached: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  photoAttachedText: {
    fontSize: 11,
    color: C.green,
    marginLeft: 6,
  },
  removeButton: {
    minHeight: 44,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 11,
    color: '#A05C69',
  },
  aiNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    paddingLeft: 3,
  },
  aiNoteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 19,
    color: C.secondary,
    marginLeft: 9,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 27,
  },

  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4E505E',
    marginBottom: 9,
  },
  required: {
    color: C.purple,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  optionalLabel: {
    fontSize: 10,
    color: C.secondary,
    marginBottom: 9,
  },
  input: {
    minHeight: 51,
    borderBottomWidth: 1,
    borderBottomColor: '#D2CCD9',
    paddingHorizontal: 2,
    paddingVertical: 13,
    fontSize: 14,
    color: C.text,
    marginBottom: 23,
  },
  textArea: {
    minHeight: 115,
    borderWidth: 1,
    borderColor: '#DFDAE7',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 13,
    lineHeight: 23,
    marginBottom: 0,
  },

  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 17,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1DCE7',
    marginRight: 7,
    marginBottom: 8,
  },
  categoryOptionSelected: {
    backgroundColor: C.lavender,
    borderColor: '#D8CBE8',
  },
  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#B5AFBF',
    marginRight: 7,
  },
  categoryDotSelected: {
    backgroundColor: C.purple,
  },
  categoryText: {
    fontSize: 11,
    color: C.secondary,
  },
  categoryTextSelected: {
    color: C.purple,
    fontWeight: '500',
  },

  readOnlyLabel: {
    fontSize: 9,
    color: C.secondary,
    marginBottom: 9,
  },
  priorityRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  priorityItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  priorityBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 10,
    lineHeight: 16,
    color: '#797580',
    textAlign: 'center',
  },
  fieldHelp: {
    fontSize: 10,
    lineHeight: 17,
    color: C.secondary,
    marginTop: 10,
    marginBottom: 24,
  },

  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D2CCD9',
    minHeight: 52,
  },
  locationInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 14,
    fontSize: 13,
    color: C.text,
  },
  gpsButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },
  gpsButtonText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: C.purple,
    marginLeft: 8,
    marginRight: 6,
  },
  gpsOptional: {
    fontSize: 9,
    color: C.secondary,
  },
  gpsResult: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  gpsResultText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
    color: C.green,
    marginLeft: 7,
  },
  locationHelp: {
    fontSize: 11,
    lineHeight: 19,
    color: C.secondary,
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clearText: {
    fontSize: 13,
    color: C.secondary,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 10,
    flexShrink: 1,
  },
  dimmed: {
    opacity: 0.7,
  },
  footerText: {
    fontSize: 10,
    lineHeight: 18,
    color: '#788171',
    textAlign: 'center',
    marginTop: 21,
  },
});

export default ExploreScreen;
