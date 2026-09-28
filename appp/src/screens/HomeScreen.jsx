import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { API_URL as BASE_API_URL } from '../config';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import {
  Bell,
  Plus,
  ArrowRight,
  MapPin,
  ThumbsUp,
  FileText,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react-native';
import Svg, {
  Rect,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import Screen from '../components/Screen';
import { AuthContext } from '../context/AuthContext';

const API_URL = `${BASE_API_URL}/incidents`;
const NOTIFICATIONS_URL = `${BASE_API_URL}/notifications`;

const C = {
  background: '#FAFAF7',
  white: '#FFFFFF',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  lavender: '#EEE7F7',
  mint: '#E7F0E5',
  green: '#507B60',
  amber: '#976D30',
  border: '#E1DFE7',
};

const BASE_CATEGORIES = [
  'Infrastructure',
  'Academics',
  'Hostel',
  'Cleanliness',
  'Security',
  'Other',
];

const STATUS_OPTIONS = ['All', 'Pending', 'In Progress', 'Resolved'];

const STATUS_META = {
  Pending: {
    color: C.amber,
    background: '#F5EDDF',
    Icon: Clock,
  },
  'In Progress': {
    color: C.purple,
    background: C.lavender,
    Icon: Wrench,
  },
  Resolved: {
    color: C.green,
    background: C.mint,
    Icon: CheckCircle2,
  },
};

const getId = value => {
  if (!value) return null;

  if (typeof value === 'object') {
    return value._id || value.userId || null;
  }

  return value;
};

const formatDate = value => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.Pending;
  const Icon = meta.Icon;

  return (
    <View style={[styles.statusBadge, { backgroundColor: meta.background }]}>
      <Icon size={12} color={meta.color} strokeWidth={1.8} />
      <Text style={[styles.statusText, { color: meta.color }]}>
        {status || 'Pending'}
      </Text>
    </View>
  );
};

const CampusGraphic = () => (
  <Svg width="90" height="90" viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="gradSky" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#EEE7F7" />
        <Stop offset="100%" stopColor="#FAFAF7" />
      </LinearGradient>
    </Defs>
    <Circle cx="50" cy="50" r="45" fill="url(#gradSky)" />

    {/* Background Building */}
    <Rect x="20" y="35" width="40" height="50" rx="4" fill="#DCD0EC" />
    <Path d="M15 35 L40 15 L65 35 Z" fill="#DCD0EC" />

    {/* Main Building */}
    <Rect x="40" y="45" width="45" height="40" rx="4" fill="#6456B8" />
    <Path d="M35 45 L62.5 25 L90 45 Z" fill="#6456B8" />

    {/* Pillars on Main Building */}
    <Rect x="46" y="55" width="5" height="30" fill="#FFFFFF" opacity="0.85" />
    <Rect x="58" y="55" width="5" height="30" fill="#FFFFFF" opacity="0.85" />
    <Rect x="70" y="55" width="5" height="30" fill="#FFFFFF" opacity="0.85" />

    {/* Clock on Main Building */}
    <Circle cx="62.5" cy="40" r="5" fill="#FFFFFF" />
    <Circle cx="62.5" cy="40" r="2.5" fill="#6456B8" />

    {/* Trees */}
    <Circle cx="25" cy="65" r="12" fill="#507B60" />
    <Rect x="23" y="75" width="4" height="10" rx="2" fill="#976D30" />

    <Circle cx="85" cy="70" r="10" fill="#507B60" />
    <Rect x="83.5" y="78" width="3" height="8" rx="1.5" fill="#976D30" />
  </Svg>
);

const HomeScreen = ({ navigation }) => {
  const { userToken, userData } = useContext(AuthContext);

  const [incidents, setIncidents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedScope, setSelectedScope] = useState('Campus');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [showCategories, setShowCategories] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const pendingUpvotes = useRef(new Set());

  const currentUserId = getId(userData);
  const firstName = userData?.name?.trim()?.split(/\s+/)[0];

  const fetchIncidents = useCallback(async () => {
    try {
      setLoadError('');

      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      setIncidents(response.data);
    } catch (error) {
      console.error(error);
      setLoadError('Reports could not be refreshed. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  }, [userToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await fetchIncidents();
    } finally {
      setRefreshing(false);
    }
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchUnread = async () => {
        try {
          const response = await axios.get(NOTIFICATIONS_URL, {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          });

          if (active) {
            setUnreadCount(
              response.data.filter(notification => !notification.isRead).length,
            );
          }
        } catch (error) {
          console.error(error);
        }
      };

      if (userToken) fetchUnread();

      return () => {
        active = false;
      };
    }, [userToken]),
  );

  const handleUpvote = async id => {
    if (!currentUserId || pendingUpvotes.current.has(id)) return;

    pendingUpvotes.current.add(id);

    try {
      setIncidents(previous =>
        previous.map(incident => {
          if (incident._id !== id) return incident;

          const upvotes = incident.upvotes || [];
          const hasUpvoted = upvotes.some(
            value => String(getId(value)) === String(currentUserId),
          );

          return {
            ...incident,
            upvotes: hasUpvoted
              ? upvotes.filter(
                  value => String(getId(value)) !== String(currentUserId),
                )
              : [...upvotes, currentUserId],
          };
        }),
      );

      await axios.patch(
        `${API_URL}/${id}/upvote`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );
    } catch (error) {
      console.error(error);
      await fetchIncidents();
    } finally {
      pendingUpvotes.current.delete(id);
    }
  };

  // Include any categories returned by the server.
  const categories = useMemo(
    () => [
      'All',
      ...new Set([
        ...BASE_CATEGORIES,
        ...incidents.map(incident => incident.category || 'Other'),
      ]),
    ],
    [incidents],
  );

  // Presentation filters only; preserve the server's report order.
  const visibleReports = useMemo(
    () =>
      incidents.filter(incident => {
        const reporterId = getId(incident.reportedBy);

        const matchesScope =
          selectedScope === 'Campus' ||
          (currentUserId &&
            reporterId &&
            String(reporterId) === String(currentUserId));

        const matchesStatus =
          selectedStatus === 'All' || incident.status === selectedStatus;

        const matchesCategory =
          selectedCategory === 'All' ||
          (incident.category || 'Other') === selectedCategory;

        return matchesScope && matchesStatus && matchesCategory;
      }),
    [incidents, currentUserId, selectedScope, selectedStatus, selectedCategory],
  );

  const hasFilters = selectedStatus !== 'All' || selectedCategory !== 'All';

  const clearFilters = () => {
    setSelectedStatus('All');
    setSelectedCategory('All');
  };

  const openReport = id => {
    navigation.navigate('ReportDetail', { incidentId: id });
  };

  const startReport = () => {
    navigation.navigate('Report');
  };

  const renderReport = ({ item }) => {
    const upvotes = item.upvotes || [];

    const hasUpvoted = Boolean(
      currentUserId &&
        upvotes.some(value => String(getId(value)) === String(currentUserId)),
    );

    const isMine = Boolean(
      currentUserId &&
        getId(item.reportedBy) &&
        String(getId(item.reportedBy)) === String(currentUserId),
    );

    return (
      <View style={styles.reportRow}>
        <TouchableOpacity
          onPress={() => openReport(item._id)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`View issue: ${item.title}. ${item.status}`}
        >
          <View style={styles.reportTop}>
            <Text style={styles.reportCategory} numberOfLines={1}>
              {item.category || 'Other'}
            </Text>

            <StatusBadge status={item.status} />
          </View>

          <View style={styles.reportMain}>
            <View style={styles.reportCopy}>
              <Text style={styles.reportTitle} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.locationRow}>
                <MapPin size={14} color={C.secondary} strokeWidth={1.7} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {item.location || 'Location not provided'}
                </Text>
              </View>

              <Text style={styles.reportDate}>
                Reported {formatDate(item.createdAt)}
                {isMine ? ' · By you' : ''}
              </Text>
            </View>

            {item.photo ? (
              <Image
                source={{ uri: item.photo }}
                style={styles.reportPhoto}
                resizeMode="cover"
                accessibilityLabel="Reported issue photo"
              />
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.reportFooter}>
          <TouchableOpacity
            style={[styles.upvoteButton, hasUpvoted && styles.upvoteSelected]}
            onPress={() => handleUpvote(item._id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${
              hasUpvoted ? 'Remove upvote' : 'Upvote issue'
            }. ${upvotes.length} upvotes`}
            accessibilityState={{ selected: hasUpvoted }}
          >
            <ThumbsUp
              size={15}
              strokeWidth={1.8}
              color={hasUpvoted ? C.purple : C.secondary}
            />

            <Text style={[styles.upvoteText, hasUpvoted && styles.purpleText]}>
              {upvotes.length} {upvotes.length === 1 ? 'upvote' : 'upvotes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => openReport(item._id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${item.title}`}
          >
            <Text style={styles.detailsText}>View details</Text>
            <ArrowRight size={15} color={C.purple} strokeWidth={1.7} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const listHeader = (
    <View>
      {/* Purpose and primary action come before filters. */}
      <View style={styles.intro}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.greeting}>
              {firstName ? `Hi, ${firstName}` : 'Welcome to Campus Trail'}
            </Text>

            <Text style={styles.heroTitle}>
              Report an issue.{'\n'}Follow its progress.
            </Text>

            <Text style={styles.heroDescription}>
              Tell campus staff what needs attention and track your report until
              it’s resolved.
            </Text>
          </View>
          <View style={styles.heroGraphic}>
            <CampusGraphic />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={startReport}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Report a campus issue"
        >
          <View style={styles.primaryButtonCopy}>
            <Plus size={20} color={C.white} strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Report an issue</Text>
          </View>

          <ArrowRight size={20} color={C.white} strokeWidth={1.8} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpToggle}
          onPress={() => setShowHowItWorks(previous => !previous)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ expanded: showHowItWorks }}
        >
          <Text style={styles.helpToggleText}>How does it work?</Text>

          {showHowItWorks ? (
            <ChevronUp size={15} color={C.secondary} />
          ) : (
            <ChevronDown size={15} color={C.secondary} />
          )}
        </TouchableOpacity>

        {showHowItWorks ? (
          <View style={styles.helpSection}>
            {[
              {
                title: 'Tell us what’s wrong',
                description: 'Add a photo, description, and location.',
              },
              {
                title: 'Staff review your report',
                description:
                  'Once assigned, use the issue conversation to share details.',
              },
              {
                title: 'Track the resolution',
                description:
                  'Open My reports to follow status changes and updates.',
              },
            ].map((step, index) => (
              <View key={step.title} style={styles.helpStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>

                <View style={styles.helpStepCopy}>
                  <Text style={styles.helpStepTitle}>{step.title}</Text>
                  <Text style={styles.helpStepDescription}>
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Clear distinction between community issues and personal tracking. */}
      <View style={styles.scopeTabs}>
        {[
          { value: 'Campus', label: 'Campus reports' },
          { value: 'Mine', label: 'My reports' },
        ].map(option => {
          const selected = selectedScope === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.scopeTab, selected && styles.scopeTabSelected]}
              onPress={() => setSelectedScope(option.value)}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.scopeTabText,
                  selected && styles.scopeTabTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.scopeDescription}>
        {selectedScope === 'Mine'
          ? 'Your submitted issues. Open a report to check updates.'
          : 'See what has been reported before adding a new issue.'}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusFilters}
      >
        {STATUS_OPTIONS.map(option => {
          const selected = selectedStatus === option;

          return (
            <TouchableOpacity
              key={option}
              style={[styles.filterPill, selected && styles.filterPillSelected]}
              onPress={() => setSelectedStatus(option)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Show ${
                option === 'All' ? 'all' : option.toLowerCase()
              } reports`}
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.filterText,
                  selected && styles.filterTextSelected,
                ]}
              >
                {option === 'All' ? 'All statuses' : option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.categoryControlRow}>
        <TouchableOpacity
          style={styles.categoryToggle}
          onPress={() => setShowCategories(previous => !previous)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ expanded: showCategories }}
        >
          <Text style={styles.categoryToggleText}>
            {selectedCategory === 'All' ? 'All categories' : selectedCategory}
          </Text>

          {showCategories ? (
            <ChevronUp size={15} color={C.secondary} />
          ) : (
            <ChevronDown size={15} color={C.secondary} />
          )}
        </TouchableOpacity>

        {hasFilters ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear status and category filters"
          >
            <X size={13} color={C.purple} />
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showCategories ? (
        <View style={styles.categoryOptions}>
          {categories.map(category => {
            const selected = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selected && styles.categoryOptionSelected,
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategories(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    selected && styles.purpleText,
                  ]}
                >
                  {category === 'All' ? 'All categories' : category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {loadError ? (
        <View style={styles.errorNotice}>
          <Text style={styles.errorText}>{loadError}</Text>

          <TouchableOpacity
            onPress={onRefresh}
            style={styles.retryButton}
            disabled={refreshing}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>
              {refreshing ? 'Retrying…' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!initialLoading && !loadError ? (
        <Text style={styles.resultsLabel}>
          {visibleReports.length}{' '}
          {visibleReports.length === 1 ? 'report' : 'reports'}
          {selectedScope === 'Mine' ? ' by you' : ''}
          {hasFilters ? ' matching your filters' : ''}
        </Text>
      ) : null}
    </View>
  );

  const emptyContent = initialLoading ? (
    <View style={styles.loadingContainer}>
      <LottieView
        source={require('../assets/animations/loading.json')}
        autoPlay
        loop
        style={styles.loadingAnimation}
      />
      <Text style={styles.loadingText}>Loading campus reports…</Text>
    </View>
  ) : loadError ? null : (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <FileText size={26} color={C.purple} strokeWidth={1.5} />
      </View>

      <Text style={styles.emptyTitle}>
        {hasFilters
          ? 'No matching reports'
          : selectedScope === 'Mine'
          ? 'Your reports will appear here'
          : 'No campus reports yet'}
      </Text>

      <Text style={styles.emptyDescription}>
        {hasFilters
          ? 'Try another status or category to see more issues.'
          : selectedScope === 'Mine'
          ? 'Submit an issue, then return here to follow its progress.'
          : 'Spotted something that needs attention? Start a report.'}
      </Text>

      <TouchableOpacity
        style={styles.emptyAction}
        onPress={hasFilters ? clearFilters : startReport}
        accessibilityRole="button"
      >
        <Text style={styles.emptyActionText}>
          {hasFilters ? 'Clear filters' : 'Report an issue'}
        </Text>
        <ArrowRight size={16} color={C.purple} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../public/app-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>campus trail</Text>
              <Text style={styles.brandSubtitle}>Campus issue reporting</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Notifications. ${unreadCount} unread`}
          >
            <Bell size={22} color={C.text} strokeWidth={1.7} />

            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.list}
          data={visibleReports}
          keyExtractor={item => String(item._id)}
          renderItem={renderReport}
          extraData={currentUserId}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.purple]}
              tintColor={C.purple}
            />
          }
          ListFooterComponent={
            !initialLoading ? (
              <View style={styles.footer}>
                {visibleReports.length > 0 ? (
                  <Text style={styles.footerText}>
                    You’ve reached the end of these reports.
                  </Text>
                ) : null}

                <Image
                  source={require('../../public/logo-bput.png')}
                  style={styles.footerLogo}
                  resizeMode="contain"
                  accessibilityLabel="University logo"
                />
              </View>
            ) : null
          }
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logo: {
    width: 32,
    height: 32,
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    fontSize: 19,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.6,
  },
  brandSubtitle: {
    color: C.secondary,
    fontSize: 11,
    marginTop: 3,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 1,
    right: 0,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: C.purple,
    borderWidth: 2,
    borderColor: C.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: C.white,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    flexGrow: 1,
  },
  intro: {
    paddingTop: 25,
    paddingBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    paddingRight: 10,
  },
  heroGraphic: {
    width: 90,
    height: 90,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  greeting: {
    color: C.purple,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  heroTitle: {
    color: C.text,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: -0.8,
    fontWeight: '600',
  },
  heroDescription: {
    color: C.secondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 420,
  },
  primaryButton: {
    minHeight: 54,
    backgroundColor: C.purple,
    borderRadius: 17,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButtonCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 12,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
    marginLeft: 9,
    flexShrink: 1,
  },
  helpToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  helpToggleText: {
    color: C.secondary,
    fontSize: 12,
    marginRight: 7,
  },
  helpSection: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  stepNumberText: {
    color: C.purple,
    fontWeight: '600',
    fontSize: 11,
  },
  helpStepCopy: {
    flex: 1,
  },
  helpStepTitle: {
    fontSize: 13,
    lineHeight: 20,
    color: C.text,
    fontWeight: '500',
  },
  helpStepDescription: {
    color: C.secondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 3,
  },

  scopeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  scopeTab: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  scopeTabSelected: {
    borderBottomColor: C.purple,
  },
  scopeTabText: {
    fontSize: 14,
    color: C.secondary,
    fontWeight: '500',
  },
  scopeTabTextSelected: {
    color: C.purple,
    fontWeight: '600',
  },
  scopeDescription: {
    color: C.secondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 12,
  },
  statusFilters: {
    paddingVertical: 2,
  },
  filterPill: {
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillSelected: {
    backgroundColor: C.lavender,
    borderColor: '#DCD0EC',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.secondary,
  },
  filterTextSelected: {
    color: C.purple,
  },
  categoryControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  categoryToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryToggleText: {
    color: C.secondary,
    fontSize: 12,
    marginRight: 7,
  },
  clearButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 11,
    color: C.purple,
    marginLeft: 4,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  categoryOption: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginRight: 7,
    marginBottom: 7,
  },
  categoryOptionSelected: {
    backgroundColor: C.lavender,
    borderColor: '#DCD0EC',
  },
  categoryOptionText: {
    fontSize: 12,
    color: C.secondary,
  },
  resultsLabel: {
    fontSize: 11,
    color: C.secondary,
    paddingBottom: 13,
    paddingTop: 4,
  },

  reportRow: {
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  reportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  reportCategory: {
    flex: 1,
    color: C.secondary,
    fontSize: 11,
    fontWeight: '500',
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 1,
  },
  statusText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '500',
    flexShrink: 1,
  },
  reportMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportCopy: {
    flex: 1,
  },
  reportTitle: {
    color: C.text,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.3,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 9,
  },
  locationText: {
    color: C.secondary,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 5,
  },
  reportDate: {
    color: C.secondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
  },
  reportPhoto: {
    width: 78,
    height: 87,
    borderRadius: 12,
    marginLeft: 14,
    backgroundColor: C.lavender,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  upvoteButton: {
    minHeight: 44,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upvoteSelected: {
    backgroundColor: C.lavender,
  },
  upvoteText: {
    color: C.secondary,
    fontSize: 11,
    marginLeft: 6,
  },
  purpleText: {
    color: C.purple,
  },
  detailsButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  detailsText: {
    color: C.purple,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },

  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    color: C.amber,
    fontSize: 12,
    lineHeight: 18,
    marginRight: 12,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  retryText: {
    fontSize: 12,
    color: C.purple,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingAnimation: {
    width: 110,
    height: 110,
  },
  loadingText: {
    fontSize: 12,
    color: C.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    color: C.text,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyDescription: {
    color: C.secondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  emptyAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  emptyActionText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: '500',
    marginRight: 7,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 11,
    lineHeight: 18,
    color: C.secondary,
    textAlign: 'center',
  },
  footerLogo: {
    width: 64,
    height: 64,
    marginTop: 18,
    opacity: 0.8,
  },
});

export default HomeScreen;
