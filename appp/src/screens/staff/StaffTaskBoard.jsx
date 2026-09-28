import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { API_URL } from '../../config';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import io from 'socket.io-client';
import {
  Briefcase,
  MapPin,
  CheckCircle2,
  Clock,
  PlayCircle,
  ArrowUpRight,
  ArrowRight, Bell,
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

const API = `${API_URL}/staff`;

const STATUSES = ['Pending', 'In Progress', 'Resolved'];

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
};

const STATUS_META = {
  Pending: {
    Icon: Clock,
    color: C.amber,
    background: '#F4ECDD',
    heading: 'Ready for attention',
    subtitle: 'The next steps toward a better campus.',
  },
  'In Progress': {
    Icon: PlayCircle,
    color: C.purple,
    background: C.lavender,
    heading: 'Progress in motion',
    subtitle: 'Keep the work moving, one issue at a time.',
  },
  Resolved: {
    Icon: CheckCircle2,
    color: C.green,
    background: C.mint,
    heading: 'Steps completed',
    subtitle: 'A trail of improvements around campus.',
  },
};

const PRIORITY_COLORS = {
  Low: '#60816A',
  Medium: C.amber,
  High: '#A76944',
  Critical: '#AD4C62',
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
              id="staffTaskBackground"
              x1="0%"
              y1="0%"
              x2="90%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#EEE7F8" />
              <Stop offset="40%" stopColor="#FAFAF7" />
              <Stop offset="75%" stopColor="#FAFAF7" />
              <Stop offset="100%" stopColor="#E9F2E6" />
            </LinearGradient>
          </Defs>

          <Rect
            width={size.width}
            height={size.height}
            fill="url(#staffTaskBackground)"
          />
        </Svg>
      )}
    </View>
  );
};

const WorkIllustration = () => (
  <View
    pointerEvents="none"
    accessible={false}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <Svg width={78} height={82} viewBox="0 0 78 82">
      <Circle cx={40} cy={39} r={32} fill="#E5EEDC" />

      <Path
        d="M11 68C51 71 16 48 47 41"
        fill="none"
        stroke="#A5B59A"
        strokeWidth={2}
        strokeDasharray="3 4"
      />

      <Rect
        x={25}
        y={15}
        width={35}
        height={46}
        rx={7}
        fill="#B6A5CD"
        transform="rotate(8 42 38)"
      />

      <Rect x={22} y={12} width={35} height={46} rx={7} fill="#F9F7FC" />
      <Rect x={32} y={9} width={15} height={8} rx={3} fill="#A18CB9" />

      <Path
        d="M29 28L32 31L37 25 M29 41L32 44L37 38"
        stroke="#82A078"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <Path
        d="M42 28H49 M42 41H49"
        stroke="#C3B6D3"
        strokeWidth={2}
        strokeLinecap="round"
      />

      <Circle cx={11} cy={68} r={4} fill="#A48FBD" />
    </Svg>
  </View>
);

const StaffTaskBoard = ({ navigation }) => {
  const { userToken, userData } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    let socket;
    if (userToken) {
      const serverUrl = API_URL.replace('/api/v1', '');
      socket = io(serverUrl, { query: { token: userToken } });
      socket.on('notification', () => {
        setUnreadCount(prev => prev + 1);
      });
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchUnread = async () => {
        try {
          const res = await axios.get(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          if (active) setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (e) { console.error(e); }
      };
      if (userToken) fetchUnread();
      return () => { active = false; };
    }, [userToken])
  );

  const scrollRef = useRef(null);
  const { width: windowWidth } = useWindowDimensions();

  const handleTabPress = (status) => {
    setSelectedStatus(status);
    const index = STATUSES.indexOf(status);
    scrollRef.current?.scrollTo({ x: index * windowWidth, animated: true });
  };

  const handleMomentumScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    if (index >= 0 && index < STATUSES.length) {
      setSelectedStatus(STATUSES[index]);
    }
  };

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/reports`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = reports.filter(
    report => report.status === selectedStatus,
  );

  const selectedMeta = STATUS_META[selectedStatus];

  const openMap = async item => {
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);

    const hasCoordinates =
      item.latitude !== null &&
      item.latitude !== undefined &&
      String(item.latitude).trim() !== '' &&
      item.longitude !== null &&
      item.longitude !== undefined &&
      String(item.longitude).trim() !== '' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    const location = String(item.location || '').trim();

    if (!hasCoordinates && !location) {
      Alert.alert('Location unavailable', 'This report has no map location.');
      return;
    }

    const url = hasCoordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error(error);
      Alert.alert('Unable to open map', 'Please try again.');
    }
  };

  const renderItemForStatus = (listData) => ({ item, index }) => {
    const meta = STATUS_META[item.status] || STATUS_META.Pending;
    const StatusIcon = meta.Icon;
    const priorityColor = PRIORITY_COLORS[item.priority] || C.secondary;
    const isLast = index === listData.length - 1;

    const openDetails = () =>
      navigation.navigate('ReportDetail', {
        incidentId: item._id,
      });

    return (
      <View style={styles.taskRow}>
        {/* Decorative trail */}
        <View style={styles.trailColumn} pointerEvents="none">
          {!isLast && <View style={styles.trailLine} />}

          <View
            style={[
              styles.trailMarker,
              { backgroundColor: meta.background },
            ]}
          >
            <Text style={[styles.trailNumber, { color: meta.color }]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.taskBody,
            !isLast && styles.taskDivider,
          ]}
        >
          <TouchableOpacity
            onPress={openDetails}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`View job details: ${item.title}`}
          >
            <View style={styles.taskMeta}>
              <View style={styles.priority}>
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityColor },
                  ]}
                />
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {item.priority
                    ? `${item.priority} priority`
                    : 'Priority not specified'}
                </Text>
              </View>

              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>

            <View style={styles.taskMain}>
              <View style={styles.flex}>
                <Text style={styles.taskTitle} numberOfLines={3}>
                  {item.title}
                </Text>

                <View style={styles.locationRow}>
                  <MapPin
                    size={13}
                    color={C.secondary}
                    strokeWidth={1.7}
                  />
                  <Text style={styles.locationText} numberOfLines={2}>
                    {item.location}
                  </Text>
                </View>
              </View>

              {item.photo ? (
                <Image
                  source={{ uri: item.photo }}
                  style={styles.taskPhoto}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={styles.taskStatusRow}>
            <StatusIcon size={14} color={meta.color} strokeWidth={1.7} />
            <Text style={[styles.statusText, { color: meta.color }]}>
              {item.status}
            </Text>
          </View>

          {/* Independent touch targets */}
          <View style={styles.taskActions}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openMap(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Open map for ${item.title}`}
            >
              <MapPin size={14} color={C.purple} strokeWidth={1.7} />
              <Text style={styles.mapButtonText}>Map</Text>
              <ArrowUpRight size={12} color={C.purple} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={openDetails}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View job details: ${item.title}`}
            >
              <Text style={styles.detailsText}>View details</Text>
              <ArrowRight size={15} color={C.purple} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEE7F8" />
      <SoftBackground />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.flex}>
          <Text style={styles.brand}>campus trail</Text>
          <Text style={styles.headerSubtitle}>
            {userData?.department
              ? `${userData.department} Department`
              : 'Staff workspace'}
          </Text>
        </View>

<View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Bell size={22} color={C.text} strokeWidth={1.7} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.avatarButton, { marginLeft: 15 }]}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
        >
          {userData?.profilePhoto ? (
            <Image
              source={{ uri: userData.profilePhoto }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        </View>
      </View>

      {/* Status navigation */}
      <View style={styles.tabs}>
        {STATUSES.map(status => {
          const count = reports.filter(
            report => report.status === status,
          ).length;
          const active = selectedStatus === status;
          const meta = STATUS_META[status];
          const Icon = meta.Icon;

          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.tab,
                active && {
                  borderBottomColor: meta.color,
                },
              ]}
              onPress={() => handleTabPress(status)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${status}, ${count} jobs`}
            >
              <View style={styles.tabTop}>
                <Icon
                  size={16}
                  color={active ? meta.color : '#8A8492'}
                  strokeWidth={1.7}
                />

                <Text
                  style={[
                    styles.tabCount,
                    active && { color: meta.color },
                  ]}
                >
                  {loading ? '—' : count}
                </Text>
              </View>

              <Text
                style={[
                  styles.tabText,
                  active && {
                    color: meta.color,
                    fontWeight: '600',
                  },
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {STATUSES.map(status => {
          const listFiltered = reports.filter(report => report.status === status);
          const listMeta = STATUS_META[status];

          return (
            <View key={status} style={{ width: windowWidth }}>
              <FlatList
                style={styles.list}
                data={listFiltered}
                keyExtractor={item => item._id}
                renderItem={renderItemForStatus(listFiltered)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingBottom: Math.max(insets.bottom, 16) + 20 },
                ]}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      fetchReports();
                    }}
                    colors={[C.purple]}
                    tintColor={C.purple}
                  />
                }
                ListHeaderComponent={
                  <View>
                    <View style={styles.intro}>
                      <View style={styles.flex}>
                        <Text style={styles.eyebrow}>YOUR TASK BOARD</Text>
                        <Text style={styles.heading}>
                          Small steps.{'\n'}Real improvements.
                        </Text>
                      </View>
                      <WorkIllustration />
                    </View>

                    <Text style={styles.introSubtitle}>
                      {listMeta.subtitle}
                    </Text>

                    <View style={styles.listHeading}>
                      <Text style={styles.listTitle}>{listMeta.heading}</Text>
                      <Text style={styles.listCount}>
                        {loading
                          ? '—'
                          : `${listFiltered.length} ${
                              listFiltered.length === 1 ? 'job' : 'jobs'
                            }`}
                      </Text>
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  loading ? (
                    <View style={styles.emptyWrap}>
                      <ActivityIndicator color={C.purple} />
                      <Text style={styles.emptyText}>Loading your task board…</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyWrap}>
                      <View
                        style={[
                          styles.emptyIcon,
                          { backgroundColor: listMeta.background },
                        ]}
                      >
                        <Briefcase
                          size={26}
                          color={listMeta.color}
                          strokeWidth={1.5}
                        />
                      </View>

                      <Text style={styles.emptyTitle}>A quiet stop.</Text>
                      <Text style={styles.emptyText}>
                        No {status.toLowerCase()} jobs.
                      </Text>
                    </View>
                  )
                }
                ListFooterComponent={
                  listFiltered.length > 0 ? (
                    <View style={styles.footer}>
                      <View style={styles.footerDot} />
                      <Text style={styles.footerText}>
                        You’ve reached the end of this list.
                      </Text>
                    </View>
                  ) : null
                }
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
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
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  brand: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.7,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 11,
    lineHeight: 18,
    color: C.secondary,
    marginTop: 5,
    paddingRight: 10,
  },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.lavender,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute', top: 10, right: 10, backgroundColor: '#FF3B30',
    minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: C.background,
  },
  notificationBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  avatarInitial: {
    color: C.purple,
    fontSize: 17,
    fontWeight: '500',
  },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  tab: {
    flex: 1,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tabCount: {
    fontSize: 14,
    fontWeight: '500',
    color: C.secondary,
    marginLeft: 7,
  },
  tabText: {
    fontSize: 11,
    lineHeight: 17,
    color: C.secondary,
    textAlign: 'center',
  },

  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 26,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#85758F',
    marginBottom: 9,
  },
  heading: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '600',
    letterSpacing: -0.9,
    color: C.text,
    paddingRight: 8,
  },
  introSubtitle: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    marginTop: 10,
  },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 20,
  },
  listTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: C.text,
    paddingRight: 10,
  },
  listCount: {
    fontSize: 10,
    color: C.secondary,
  },

  taskRow: {
    flexDirection: 'row',
  },
  trailColumn: {
    width: 30,
    marginRight: 12,
    alignItems: 'center',
  },
  trailLine: {
    position: 'absolute',
    top: 31,
    bottom: -7,
    left: 14,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D2C8DE',
  },
  trailMarker: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  trailNumber: {
    fontSize: 9,
    fontWeight: '600',
  },
  taskBody: {
    flex: 1,
    paddingTop: 5,
    paddingBottom: 13,
    marginBottom: 17,
  },
  taskDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  priority: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingVertical: 2,
  },
  priorityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 5,
  },
  priorityText: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 10,
    lineHeight: 16,
    color: C.secondary,
    paddingVertical: 2,
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: C.text,
  },
  taskPhoto: {
    width: 70,
    height: 83,
    borderRadius: 9,
    backgroundColor: '#E9E6EC',
    marginLeft: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 9,
  },
  locationText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: C.secondary,
    marginLeft: 5,
  },
  taskStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 5,
  },
  taskActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  mapButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  mapButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: C.purple,
    marginLeft: 5,
    marginRight: 3,
  },
  detailsButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  detailsText: {
    fontSize: 11,
    fontWeight: '500',
    color: C.purple,
    marginRight: 6,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 45,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 61,
    height: 61,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: C.text,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 20,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
    paddingTop: 3,
  },
  footerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ABC0A4',
    marginRight: 24,
  },
  footerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 18,
    color: '#778173',
  },
});

export default StaffTaskBoard;
