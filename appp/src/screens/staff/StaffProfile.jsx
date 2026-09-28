import React, { useContext, useEffect, useState, useCallback } from 'react';
import { API_URL } from '../../config';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  ArrowLeft,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';
import axios from 'axios';

import { AuthContext } from '../../context/AuthContext';

const API = API_URL;

const C = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  lavender: '#EEE7F7',
  mint: '#E7F0E5',
  green: '#507B60',
  amber: '#976D30',
  border: '#E1DFE7',
  danger: '#A15C68',
};

const SoftBackground = () => {
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
              id="staffProfileGradient"
              x1="0%"
              y1="0%"
              x2="85%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#EEE7F8" />
              <Stop offset="40%" stopColor="#FAFAF7" />
              <Stop offset="75%" stopColor="#FAFAF7" />
              <Stop offset="100%" stopColor="#E8F1E5" />
            </LinearGradient>
          </Defs>

          <Rect
            width={size.width}
            height={size.height}
            fill="url(#staffProfileGradient)"
          />
        </Svg>
      )}
    </View>
  );
};

// Small decorative illustration, not an interactive control.
const TrailIllustration = () => (
  <View
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <Svg width={65} height={68} viewBox="0 0 65 68">
      <Circle cx={33} cy={33} r={27} fill="#E5EDDD" />

      <Path
        d="M13 56C48 58 13 35 40 28"
        stroke="#A9B69E"
        strokeWidth={2}
        strokeDasharray="3 4"
        fill="none"
      />

      <Circle cx={41} cy={23} r={13} fill="#A2B798" />
      <Path
        d="M35 23L39 27L47 19"
        stroke="#FFFFFF"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <Circle cx={13} cy={56} r={4} fill="#AD9CC5" />
    </Svg>
  </View>
);

const SectionHeading = ({ number, title, subtitle, children }) => (
  <View style={styles.sectionHeading}>
    <View style={styles.sectionNumber}>
      <Text style={styles.sectionNumberText}>{number}</Text>
    </View>

    <View style={styles.flex}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>

    {children}
  </View>
);

const StaffProfile = ({ navigation }) => {
  const { userData, userToken, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState(null);
  const [resolvedJobs, setResolvedJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        axios.get(`${API}/staff/stats`, {
          headers: { Authorization: `Bearer ${userToken}` },
        }),
        axios.get(`${API}/staff/reports`, {
          headers: { Authorization: `Bearer ${userToken}` },
        }),
      ]);

      setStats(statsRes.data);

      const resolved = reportsRes.data.filter(
        report =>
          report.status === 'Resolved' &&
          (report.assignedTo?._id === userData?._id ||
            report.assignedTo === userData?._id),
      );

      // Preserve the server's order and show the first five.
      setResolvedJobs(resolved.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [userToken, userData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = [
    {
      label: 'Total assigned',
      value: stats?.totalAssigned ?? '—',
      Icon: Activity,
      color: C.purple,
      background: C.lavender,
    },
    {
      label: 'Jobs resolved',
      value: stats?.resolved ?? '—',
      Icon: CheckCircle2,
      color: C.green,
      background: C.mint,
    },
    {
      label: 'In progress',
      value: stats?.inProgress ?? '—',
      Icon: Clock,
      color: C.amber,
      background: '#F3EBDD',
    },
  ];

  return (
    <View style={styles.container}>
      <SoftBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData();
            }}
            colors={[C.purple]}
            tintColor={C.purple}
          />
        }
      >
        <View style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={21} color={C.text} />
            </TouchableOpacity>

            <View style={styles.flex}>
              <Text style={styles.brand}>campus trail</Text>
              <Text style={styles.headerSubtitle}>Staff profile</Text>
            </View>

            <View style={styles.headerAccent} pointerEvents="none">
              <View style={styles.accentDot} />
              <View style={styles.accentLine} />
            </View>
          </View>

          {/* Introduction */}
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>THE PEOPLE BEHIND THE PROGRESS</Text>
            <Text style={styles.heading}>Your part in the trail.</Text>
            <Text style={styles.subtitle}>
              Caring for campus, one issue at a time.
            </Text>
          </View>

          {/* Identity */}
          <View style={styles.identity}>
            <View style={styles.portraitComposition}>
              <View pointerEvents="none" style={styles.mintLayer} />
              <View pointerEvents="none" style={styles.lavenderLayer} />

              <View style={styles.portraitFrame}>
                {userData?.profilePhoto ? (
                  <Image
                    source={{ uri: userData.profilePhoto }}
                    style={styles.portrait}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.portrait, styles.placeholder]}>
                    <Text style={styles.initial}>
                      {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>

              <View pointerEvents="none" style={styles.portraitDot} />
            </View>

            <Text style={styles.name}>{userData?.name}</Text>

            {userData?.department ? (
              <Text style={styles.department}>
                {userData.department} Department
              </Text>
            ) : null}

            <View style={styles.staffBadge}>
              <View style={styles.staffDot} />
              <Text style={styles.staffBadgeText}>CAMPUS STAFF</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Open metrics */}
          <SectionHeading
            number="01"
            title="Your contribution"
            subtitle="A look at your assigned work."
          />

          <View style={styles.metrics}>
            {metrics.map(({ label, value, Icon, color, background }, index) => (
              <View
                key={label}
                style={[styles.metric, index > 0 && styles.metricSeparator]}
              >
                <View
                  style={[styles.metricIcon, { backgroundColor: background }]}
                >
                  <Icon size={18} color={color} strokeWidth={1.7} />
                </View>

                <Text style={styles.metricValue}>{value}</Text>
                <Text style={styles.metricLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Resolution trail */}
          <SectionHeading
            number="02"
            title="Recently resolved"
            subtitle="The fixes you helped complete."
          >
            <TrailIllustration />
          </SectionHeading>

          {resolvedJobs.length > 0 ? (
            <View style={styles.history}>
              {resolvedJobs.map((job, index) => (
                <View key={job._id} style={styles.historyRow}>
                  <View style={styles.trailColumn} pointerEvents="none">
                    {index !== resolvedJobs.length - 1 ? (
                      <View style={styles.trailLine} />
                    ) : null}

                    <View style={styles.trailNode}>
                      <CheckCircle2
                        size={15}
                        color={C.green}
                        strokeWidth={1.8}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.job,
                      index !== resolvedJobs.length - 1 && styles.jobSeparator,
                    ]}
                    onPress={() =>
                      navigation.navigate('ReportDetail', {
                        incidentId: job._id,
                      })
                    }
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`View resolved report: ${job.title}`}
                  >
                    <View style={styles.flex}>
                      <Text style={styles.resolvedLabel}>RESOLVED</Text>

                      <Text style={styles.jobTitle} numberOfLines={2}>
                        {job.title}
                      </Text>

                      <View style={styles.jobLocationRow}>
                        <MapPin
                          size={13}
                          color={C.secondary}
                          strokeWidth={1.6}
                        />
                        <Text style={styles.jobLocation} numberOfLines={2}>
                          {job.location}
                        </Text>
                      </View>
                    </View>

                    <ArrowRight
                      size={17}
                      color="#A49AAD"
                      style={styles.jobArrow}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <View style={styles.emptyIcon}>
                <CheckCircle2 size={22} color={C.green} strokeWidth={1.5} />
              </View>

              <View style={styles.flex}>
                <Text style={styles.emptyTitle}>
                  Your resolution trail starts here.
                </Text>
                <Text style={styles.emptyText}>No recently resolved jobs.</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <View style={styles.logoutIcon}>
              <LogOut size={19} color={C.danger} strokeWidth={1.7} />
            </View>

            <View style={styles.flex}>
              <Text style={styles.logoutText}>Log out</Text>
              <Text style={styles.logoutHint}>
                Sign out of your staff account.
              </Text>
            </View>

            <ArrowRight size={17} color="#AC9299" />
          </TouchableOpacity>

          <View style={styles.footer}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>Small steps. Better campus.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  page: {
    width: '100%',
    maxWidth: 520,
  },
  flex: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 17,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brand: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 10,
    color: C.secondary,
    marginTop: 3,
  },
  headerAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#AAC3A6',
    marginRight: 5,
  },
  accentLine: {
    width: 17,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9BCDD',
  },

  intro: {
    paddingTop: 17,
  },
  eyebrow: {
    fontSize: 8,
    lineHeight: 15,
    letterSpacing: 1.4,
    color: '#82758E',
    marginBottom: 9,
  },
  heading: {
    fontSize: 29,
    lineHeight: 37,
    fontWeight: '600',
    letterSpacing: -0.9,
    color: C.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    marginTop: 8,
  },

  identity: {
    alignItems: 'center',
    paddingTop: 27,
    paddingBottom: 2,
  },
  portraitComposition: {
    width: 159,
    height: 146,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  mintLayer: {
    position: 'absolute',
    width: 109,
    height: 114,
    right: 7,
    top: 22,
    borderRadius: 28,
    backgroundColor: '#DFEBD9',
    transform: [{ rotate: '11deg' }],
  },
  lavenderLayer: {
    position: 'absolute',
    width: 108,
    height: 114,
    left: 10,
    top: 9,
    borderRadius: 28,
    backgroundColor: '#E1D8ED',
    transform: [{ rotate: '-10deg' }],
  },
  portraitFrame: {
    width: 110,
    height: 114,
    padding: 4,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  portrait: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    backgroundColor: C.lavender,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 42,
    fontWeight: '500',
    color: C.purple,
  },
  portraitDot: {
    position: 'absolute',
    left: 16,
    bottom: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CDB792',
  },
  name: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: C.text,
    textAlign: 'center',
  },
  department: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    marginTop: 5,
    textAlign: 'center',
  },
  staffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: C.mint,
    marginTop: 13,
  },
  staffDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#829D7D',
    marginRight: 6,
  },
  staffBadgeText: {
    fontSize: 9,
    letterSpacing: 0.8,
    color: C.green,
    fontWeight: '500',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginVertical: 27,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 21,
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
    color: C.purple,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
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
    paddingRight: 5,
  },

  metrics: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 2,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  metricSeparator: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: C.border,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  metricValue: {
    fontSize: 29,
    fontWeight: '500',
    color: C.text,
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 10,
    lineHeight: 16,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 5,
  },

  history: {
    paddingTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
  },
  trailColumn: {
    width: 30,
    marginRight: 12,
    alignItems: 'center',
  },
  trailLine: {
    position: 'absolute',
    top: 28,
    bottom: -12,
    left: 14,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C3CFBC',
  },
  trailNode: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },
  job: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    paddingTop: 8,
    paddingBottom: 19,
    marginBottom: 12,
  },
  jobSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  resolvedLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: C.green,
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.2,
    color: C.text,
  },
  jobLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 7,
  },
  jobLocation: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: C.secondary,
    marginLeft: 5,
  },
  jobArrow: {
    marginLeft: 11,
  },
  emptyHistory: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    color: C.text,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 19,
    color: C.secondary,
    marginTop: 5,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingVertical: 6,
  },
  logoutIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#F3E8EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.danger,
  },
  logoutHint: {
    fontSize: 11,
    lineHeight: 18,
    color: C.secondary,
    marginTop: 4,
    paddingRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 10,
    lineHeight: 18,
    color: '#778173',
    textAlign: 'center',
  },
});

export default StaffProfile;
