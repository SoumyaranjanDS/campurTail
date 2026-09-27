import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import axios from 'axios';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Clock,
  Wrench,
  Camera,
  Send,
  Activity,
  MessageCircle,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';
import { launchCamera } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';

const API_URL = 'http://10.0.4.85:5000/api/v1/incidents';

const C = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  muted: '#82838F',
  purple: '#6456B8',
  lavender: '#EEE7F7',
  mint: '#E7F0E5',
  green: '#507B60',
  amber: '#976D30',
  border: '#E1DFE7',
};

/*
 * Measured dimensions preserve the gradient sizing fix.
 * The background never participates in the page layout.
 */
const SoftBackground = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}
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
              id="reportBackground"
              x1="0%"
              y1="0%"
              x2="80%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#EDE6F8" />
              <Stop offset="38%" stopColor="#FAFAF7" />
              <Stop offset="72%" stopColor="#FAFAF7" />
              <Stop offset="100%" stopColor="#E9F2E9" />
            </LinearGradient>
          </Defs>

          <Rect
            width={size.width}
            height={size.height}
            fill="url(#reportBackground)"
          />
        </Svg>
      )}
    </View>
  );
};

const JourneyIllustration = () => (
  <View
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <Svg width={68} height={74} viewBox="0 0 68 74">
      <Circle cx={35} cy={36} r={28} fill="#E8EFDF" />
      <Path
        d="M16 58C53 59 13 31 44 24"
        stroke="#A6B79B"
        strokeWidth={2}
        strokeDasharray="3 4"
        fill="none"
      />
      <Path
        d="M44 12C36 12 31 18 31 25C31 35 44 45 44 45S57 35 57 25C57 18 52 12 44 12Z"
        fill="#A998C4"
      />
      <Circle cx={44} cy={25} r={5} fill="#FCFAFF" />
      <Circle cx={16} cy={58} r={4} fill="#839B76" />
    </Svg>
  </View>
);

const SectionHeading = ({ number, title, subtitle, accessory }) => (
  <View style={styles.sectionHeading}>
    <View style={styles.sectionNumber}>
      <Text style={styles.sectionNumberText}>{number}</Text>
    </View>

    <View style={styles.flex}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>

    {accessory}
  </View>
);

const Avatar = ({ person, small = false }) => {
  const avatarStyle = [styles.avatar, small && styles.avatarSmall];

  return person?.profilePhoto ? (
    <Image source={{ uri: person.profilePhoto }} style={avatarStyle} />
  ) : (
    <View style={[...avatarStyle, styles.avatarPlaceholder]}>
      <Text style={styles.avatarLetter}>{person?.name?.charAt(0) || 'U'}</Text>
    </View>
  );
};

const ReportDetailScreen = ({ route, navigation }) => {
  const { incidentId } = route.params;
  const { userToken, userData } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const insets = useSafeAreaInsets();

  const [incident, setIncident] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showStaffAction, setShowStaffAction] = useState(false);
  const [newStatus, setNewStatus] = useState('In Progress');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    fetchIncidentDetail();
  }, [incidentId]);

  const fetchIncidentDetail = async () => {
    try {
      const response = await axios.get(`${API_URL}/${incidentId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      setIncident(response.data.incident);
      setUpdates(response.data.updates);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Could not load incident details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    launchCamera({ mediaType: 'photo', quality: 0.7 }, response => {
      if (!response.didCancel && !response.errorMessage && response.assets) {
        setPhoto(response.assets[0]);
      }
    });
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    setIsPostingComment(true);

    try {
      await axios.post(
        `${API_URL}/${incidentId}/comments`,
        { text: commentText },
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );

      setCommentText('');
      fetchIncidentDetail();
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleStaffUpdate = async () => {
    if (!note) {
      showAlert('Error', 'Please provide a note for this update.');
      return;
    }

    if (newStatus === 'Resolved' && !photo) {
      showAlert(
        'Error',
        'Proof of repair (photo) is required to mark as Resolved.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('note', note);

      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          type: photo.type,
          name: photo.fileName || 'repair.jpg',
        });
      }

      await axios.patch(`${API_URL}/${incidentId}/status`, formData, {
        headers: {
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      showAlert('Success', 'Status updated successfully!');
      setShowStaffAction(false);
      setNote('');
      setPhoto(null);
      fetchIncidentDetail();
    } catch (error) {
      console.error(error);
      showAlert(
        'Error',
        error.response?.data?.message || 'Failed to update status.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <SoftBackground />
        <JourneyIllustration />
        <Text style={styles.loadingTitle}>Opening this stop…</Text>
        <ActivityIndicator color={C.purple} style={{ marginTop: 18 }} />
      </View>
    );
  }

  if (!incident) return null;

  const statusColor =
    incident.status === 'Resolved'
      ? C.green
      : incident.status === 'In Progress'
      ? C.purple
      : C.amber;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SoftBackground />

      {/* Minimal fixed header */}
      <View
        style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.7}
        >
          <ArrowLeft size={21} color={C.text} />
        </TouchableOpacity>

        <View style={styles.flex}>
          <Text style={styles.headerBrand}>campus pulse</Text>
          <Text style={styles.headerSubtitle}>A closer look</Text>
        </View>

        <Activity size={22} color={C.purple} strokeWidth={1.7} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial introduction */}
        <View style={styles.hero}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryDash} />
            <Text style={styles.categoryText}>{incident.category}</Text>
          </View>

          <Text style={styles.title}>{incident.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={16} color={C.purple} strokeWidth={1.7} />
            <Text style={styles.locationText}>{incident.location}</Text>
          </View>

          <View style={styles.metadataRow}>
            <View style={styles.statusLabel}>
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {incident.status}
              </Text>
            </View>

            <View style={styles.metadataDivider} />

            <Text
              style={[
                styles.priorityText,
                incident.priority === 'Critical' && styles.criticalText,
              ]}
            >
              {incident.priority} priority
            </Text>
          </View>
        </View>

        {/* Photo journal */}
        {incident.photo ? (
          <View style={styles.photoSection}>
            <View style={styles.photoFrame}>
              <Image
                source={{ uri: incident.photo }}
                style={styles.mainImage}
                resizeMode="cover"
              />

              <View pointerEvents="none" style={styles.photoTape} />
            </View>

            <View style={styles.photoCaption}>
              <Camera size={13} color={C.secondary} strokeWidth={1.7} />
              <Text style={styles.captionText}>The reported scene</Text>
              <Text style={styles.captionDate}>
                {new Date(incident.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Description */}
        <SectionHeading
          number="01"
          title="At this stop"
          subtitle="What needs our attention."
        />

        <Text style={styles.description}>{incident.description}</Text>

        <View style={styles.peopleContainer}>
          <View style={[styles.reporterRow, { flex: 1, borderRightWidth: incident.assignedTo ? 1 : 0, borderRightColor: C.border }]}>
            <Avatar person={incident.reportedBy} />
            <View style={styles.flex}>
              <Text style={styles.smallLabel}>REPORTED BY</Text>
              <Text style={styles.reporterName}>
                {incident.reportedBy?.name || 'Unknown User'}
              </Text>
              <Text style={styles.reporterDate}>
                {new Date(incident.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {incident.assignedTo ? (
            <View style={[styles.reporterRow, { flex: 1, paddingLeft: 16 }]}>
              <Avatar person={incident.assignedTo} />
              <View style={styles.flex}>
                <Text style={styles.smallLabel}>ASSIGNED TO</Text>
                <Text style={styles.reporterName}>
                  {incident.assignedTo?.name || 'Field Worker'}
                </Text>
                <Text style={styles.reporterDate}>
                  {incident.assignedTo?.department || 'Staff'} Dept
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.reporterRow, { flex: 1, paddingLeft: 16 }]}>
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: C.border }]}>
                <Text style={styles.avatarLetter}>?</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.smallLabel}>ASSIGNED TO</Text>
                <Text style={[styles.reporterName, { color: C.secondary, fontSize: 13, fontWeight: '500' }]}>
                  Unassigned
                </Text>
                <Text style={styles.reporterDate}>
                  Pending pickup
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* Actual recorded updates */}
        <SectionHeading
          number="02"
          title="The issue journey"
          subtitle="Small steps toward a better campus."
          accessory={<JourneyIllustration />}
        />

        <View style={styles.journey}>
          {(updates || []).length === 0 ? (
            <View style={styles.emptyJourney}>
              <View style={styles.timelineIcon}>
                <Clock size={17} color={C.purple} />
              </View>

              <View style={styles.flex}>
                <Text style={styles.timelineTitle}>
                  The journey starts here
                </Text>
                <Text style={styles.timelineNote}>
                  No updates yet. Staff will review soon.
                </Text>
              </View>
            </View>
          ) : (
            (updates || []).map((update, index) => {
              const resolved = update.newStatus === 'Resolved';

              return (
                <View key={update?._id || index} style={styles.timelineItem}>
                  {index !== updates.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}

                  <View
                    style={[
                      styles.timelineIcon,
                      resolved && styles.timelineIconResolved,
                    ]}
                  >
                    {resolved ? (
                      <CheckCircle size={17} color={C.green} />
                    ) : (
                      <Wrench size={17} color={C.purple} />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>
                      Status changed to {update.newStatus}
                    </Text>

                    <Text style={styles.timelineDate}>
                      {new Date(update.createdAt).toLocaleString()}
                    </Text>

                    <Text style={styles.timelineAuthor}>
                      {update.updatedBy?.name || 'System'}
                      {update.updatedBy?.role
                        ? ` · ${update.updatedBy.role}`
                        : ''}
                    </Text>

                    <Text style={styles.timelineNote}>{update.note}</Text>

                    {update.photo ? (
                      <View style={styles.updatePhotoSection}>
                        <Image
                          source={{ uri: update.photo }}
                          style={styles.updatePhoto}
                          resizeMode="cover"
                        />
                        <Text style={styles.evidenceCaption}>
                          Photo attached to this update
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Staff actions: same role/status checks */}
        {(userData?.role === 'staff' || userData?.role === 'admin') &&
          incident.status !== 'Resolved' && (
            <View style={styles.staffSection}>
              {!showStaffAction ? (
                <>
                  <Text style={styles.staffHeading}>
                    Move this issue forward.
                  </Text>
                  <Text style={styles.staffSubtitle}>
                    Add a work note and let campus know what changed.
                  </Text>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setShowStaffAction(true)}
                    activeOpacity={0.8}
                  >
                    <Wrench size={17} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      Add Staff Update
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.staffHeading}>Add your update</Text>
                  <Text style={styles.staffSubtitle}>
                    Record the work behind the progress.
                  </Text>

                  <Text style={styles.fieldLabel}>Status</Text>

                  <View style={styles.statusOptions}>
                    {['In Progress', 'Resolved'].map(status => {
                      const selected = newStatus === status;
                      const resolved = status === 'Resolved';
                      const Icon = resolved ? CheckCircle : Clock;
                      const color = selected
                        ? resolved
                          ? C.green
                          : C.purple
                        : C.secondary;

                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            selected && styles.statusOptionActive,
                            selected && resolved && styles.statusOptionResolved,
                          ]}
                          onPress={() => setNewStatus(status)}
                          activeOpacity={0.75}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <Icon size={16} color={color} />
                          <Text style={[styles.statusOptionText, { color }]}>
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>Work note</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Notes on what you did..."
                    placeholderTextColor={C.muted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    accessibilityLabel="Work note"
                  />

                  <Text style={styles.fieldLabel}>Repair evidence</Text>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={handlePickImage}
                    activeOpacity={0.75}
                  >
                    <Camera size={21} color={C.purple} />
                    <Text style={styles.photoButtonText}>
                      {photo
                        ? 'Photo Attached'
                        : 'Attach Proof Photo (Required for Resolved)'}
                    </Text>
                  </TouchableOpacity>

                  {photo ? (
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.previewPhoto}
                      resizeMode="cover"
                    />
                  ) : null}

                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowStaffAction(false)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        styles.submitButton,
                        isSubmitting && styles.dimmed,
                      ]}
                      onPress={handleStaffUpdate}
                      disabled={isSubmitting}
                      activeOpacity={0.8}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

        <View style={styles.sectionDivider} />

        {/* Open discussion rows */}
        <SectionHeading
          number="03"
          title="Around this issue"
          subtitle="Discussion"
          accessory={<Text style={styles.commentCount}>{comments.length}</Text>}
        />

        {comments.length === 0 ? (
          <View style={styles.emptyDiscussion}>
            <MessageCircle size={19} color={C.secondary} />
            <Text style={styles.emptyDiscussionText}>
              Have something to add? Start the conversation below.
            </Text>
          </View>
        ) : null}

        {(comments || []).map((comment, index) => (
          <View
            key={comment?._id || `comment-${index}`}
            style={styles.commentRow}
          >
            <Avatar person={comment.user} small />

            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentName}>
                  {comment.user?.name || 'Unknown User'}
                </Text>

                {(comment.user?.role === 'staff' ||
                  comment.user?.role === 'admin') && (
                  <Text style={styles.roleLabel}>
                    {comment.user.role === 'admin' ? 'Admin' : 'Staff'}
                  </Text>
                )}
              </View>

              <Text style={styles.commentText}>{comment.text}</Text>

              <Text style={styles.commentDate}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Fixed composer */}
      <View
        style={[
          styles.composer,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={C.muted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          accessibilityLabel="Add a comment"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !commentText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handlePostComment}
          disabled={!commentText.trim() || isPostingComment}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Post comment"
        >
          {isPostingComment ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={19} color={commentText.trim() ? '#FFFFFF' : C.muted} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: C.text,
    marginTop: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerBrand: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 10,
    color: C.secondary,
    marginTop: 3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  hero: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  categoryDash: {
    width: 17,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#A694C0',
    marginRight: 8,
  },
  categoryText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.7,
    color: C.purple,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.9,
    color: C.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: C.secondary,
    marginLeft: 7,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 18,
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metadataDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#D3CDDA',
    marginHorizontal: 13,
  },
  priorityText: {
    fontSize: 11,
    color: C.secondary,
    paddingVertical: 4,
  },
  criticalText: {
    color: '#B14C5E',
    fontWeight: '600',
  },

  photoSection: {
    marginBottom: 26,
  },
  photoFrame: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 5,
  },
  mainImage: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 2,
    backgroundColor: '#E9E7EB',
  },
  photoTape: {
    position: 'absolute',
    width: 62,
    height: 17,
    backgroundColor: 'rgba(216,207,233,0.78)',
    top: -7,
    left: 20,
    transform: [{ rotate: '-7deg' }],
  },
  photoCaption: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 11,
    paddingHorizontal: 3,
  },
  captionText: {
    fontSize: 10,
    color: C.secondary,
    marginLeft: 6,
    marginRight: 10,
  },
  captionDate: {
    marginLeft: 'auto',
    fontSize: 10,
    color: C.secondary,
    paddingVertical: 3,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionNumber: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#EAE3F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    letterSpacing: -0.4,
    color: C.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 18,
    color: C.secondary,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 25,
    color: '#565B68',
    marginBottom: 22,
  },
  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: C.lavender,
    marginRight: 11,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 11,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '500',
    color: C.purple,
  },
  smallLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: C.secondary,
    marginBottom: 4,
  },
  reporterName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  reporterDate: {
    fontSize: 10,
    color: C.secondary,
    marginTop: 4,
  },
  peopleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 28,
  },

  journey: {
    paddingTop: 2,
  },
  emptyJourney: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 16,
    top: 34,
    bottom: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9BED8',
  },
  timelineIcon: {
    width: 33,
    height: 33,
    borderRadius: 12,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  timelineIconResolved: {
    backgroundColor: C.mint,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 5,
    paddingBottom: 26,
  },
  timelineTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: C.text,
  },
  timelineDate: {
    fontSize: 10,
    lineHeight: 17,
    color: C.secondary,
    marginTop: 5,
  },
  timelineAuthor: {
    fontSize: 10,
    lineHeight: 17,
    color: C.purple,
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 13,
    lineHeight: 22,
    color: C.secondary,
    marginTop: 8,
  },
  updatePhotoSection: {
    marginTop: 13,
  },
  updatePhoto: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 8,
    backgroundColor: '#E8E7EB',
  },
  evidenceCaption: {
    fontSize: 9,
    lineHeight: 15,
    color: C.secondary,
    marginTop: 6,
  },

  staffSection: {
    marginTop: 15,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  staffHeading: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: C.text,
  },
  staffSubtitle: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    marginTop: 7,
    marginBottom: 18,
  },
  primaryButton: {
    minHeight: 49,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    flexShrink: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.text,
    marginBottom: 9,
  },
  statusOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 13,
    minHeight: 46,
    borderBottomWidth: 2,
    borderBottomColor: '#DEDDE3',
  },
  statusOptionActive: {
    backgroundColor: '#F0EBF8',
    borderBottomColor: '#9D88BD',
  },
  statusOptionResolved: {
    backgroundColor: '#EBF3E8',
    borderBottomColor: '#86A17B',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 7,
    flexShrink: 1,
  },
  noteInput: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEDAE7',
    backgroundColor: 'rgba(255,255,255,0.72)',
    padding: 13,
    fontSize: 13,
    lineHeight: 22,
    color: C.text,
    marginBottom: 20,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BEB1D0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  photoButtonText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: C.purple,
    marginLeft: 11,
  },
  previewPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: C.lavender,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    minHeight: 49,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelText: {
    fontSize: 13,
    color: C.secondary,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
  },
  submitText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dimmed: {
    opacity: 0.7,
  },

  commentCount: {
    fontSize: 19,
    fontWeight: '500',
    color: C.purple,
    marginLeft: 12,
  },
  emptyDiscussion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 15,
  },
  emptyDiscussionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    marginLeft: 10,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 19,
  },
  commentContent: {
    flex: 1,
    paddingBottom: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  commentHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentName: {
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
    color: C.text,
    marginRight: 8,
    flexShrink: 1,
  },
  roleLabel: {
    fontSize: 10,
    color: C.purple,
    backgroundColor: C.lavender,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#565B68',
  },
  commentDate: {
    fontSize: 10,
    color: C.secondary,
    marginTop: 8,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 18,
    backgroundColor: '#FAFAF7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  commentInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    borderRadius: 14,
    backgroundColor: '#F0EDF4',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 13,
    lineHeight: 20,
    color: C.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },
  sendButtonDisabled: {
    backgroundColor: '#E9E5EE',
  },
});

export default ReportDetailScreen;
