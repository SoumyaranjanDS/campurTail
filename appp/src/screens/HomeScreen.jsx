import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import {
  Activity,
  ThumbsUp,
  MapPin,
  ArrowUpRight,
  Compass,
} from 'lucide-react-native';
import Svg, { Rect, Path, Circle, Ellipse } from 'react-native-svg';

import Screen from '../components/Screen';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://10.0.4.85:5000/api/v1/incidents';

const COLORS = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  lavender: '#EEEAF8',
  border: '#E6E6DF',
};

const CATEGORY_META = {
  Infrastructure: {
    color: '#79639F',
    background: '#EEE7F7',
    subtitle: 'The spaces we share.',
  },
  Academics: {
    color: '#62809B',
    background: '#E7EEF6',
    subtitle: 'A better place to learn.',
  },
  Hostel: {
    color: '#A47A50',
    background: '#F5EBDD',
    subtitle: 'A little closer to home.',
  },
  Cleanliness: {
    color: '#61886D',
    background: '#E7F0E5',
    subtitle: 'Care for our everyday spaces.',
  },
  Security: {
    color: '#947185',
    background: '#F2E7ED',
    subtitle: 'Looking out for each other.',
  },
  Other: {
    color: '#7D7A69',
    background: '#EFEEE4',
    subtitle: 'Everything else that matters.',
  },
};

const CATEGORIES = ['All', ...Object.keys(CATEGORY_META)];

const getCategoryMeta = category =>
  CATEGORY_META[category] || CATEGORY_META.Other;

/*
 * Small code-drawn illustrations.
 * Fixed SVG dimensions avoid the earlier gradient sizing issue.
 */
const CategoryArt = ({ category, size = 64 }) => {
  const { color, background } = getCategoryMeta(category);

  let artwork;

  switch (category) {
    case 'Infrastructure':
      artwork = (
        <>
          <Rect
            x={18}
            y={30}
            width={17}
            height={27}
            rx={3}
            fill={color}
            opacity={0.5}
          />
          <Rect x={33} y={20} width={22} height={37} rx={3} fill={color} />
          <Path
            d="M39 28H43 M47 28H50 M39 36H43 M47 36H50 M23 38H28 M23 45H28"
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Rect x={41} y={47} width={7} height={10} rx={2} fill={background} />
        </>
      );
      break;

    case 'Academics':
      artwork = (
        <>
          <Path
            d="M36 27 Q25 19 15 24 V51 Q25 46 36 54Z"
            fill={color}
            opacity={0.55}
          />
          <Path d="M36 27 Q47 19 57 24 V51 Q47 46 36 54Z" fill={color} />
          <Path d="M36 28V53" stroke="#FFFFFF" strokeWidth={2} />
          <Path
            d="M21 31L29 33 M21 38L29 40 M43 33L51 31 M43 40L51 38"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      );
      break;

    case 'Hostel':
      artwork = (
        <>
          <Path d="M13 32L36 14L59 32Z" fill={color} />
          <Rect
            x={20}
            y={30}
            width={32}
            height={27}
            rx={3}
            fill={color}
            opacity={0.6}
          />
          <Rect x={26} y={36} width={7} height={7} rx={2} fill="#FFFFFF" />
          <Rect x={40} y={36} width={7} height={7} rx={2} fill="#FFFFFF" />
          <Rect x={32} y={46} width={9} height={11} rx={2} fill={color} />
        </>
      );
      break;

    case 'Cleanliness':
      artwork = (
        <>
          <Path
            d="M39 21 Q59 18 55 37 Q38 43 39 21Z"
            fill={color}
            opacity={0.6}
          />
          <Path
            d="M39 41L49 28"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Rect x={20} y={34} width={23} height={23} rx={4} fill={color} />
          <Path
            d="M18 32H45 M27 27H36 M27 41V50 M35 41V50"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Path
            d="M27 41V50 M35 41V50"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      );
      break;

    case 'Security':
      artwork = (
        <>
          <Rect x={14} y={29} width={9} height={28} rx={2} fill={color} />
          <Rect x={49} y={29} width={9} height={28} rx={2} fill={color} />
          <Path
            d="M22 35Q36 20 50 35"
            stroke={color}
            strokeWidth={4}
            fill="none"
          />
          <Path
            d="M28 36V56 M36 32V56 M44 36V56 M24 46H49"
            stroke={color}
            strokeWidth={2}
          />
          <Circle cx={36} cy={16} r={6} fill={color} opacity={0.45} />
        </>
      );
      break;

    default:
      artwork = (
        <>
          <Path
            d="M35 17V58"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Path d="M20 22H48L56 29L48 36H20Z" fill={color} />
          <Path d="M48 39H22L15 45L22 51H48Z" fill={color} opacity={0.5} />
          <Path
            d="M27 29H43"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Circle cx={36} cy={36} r={31} fill={background} />
      <Ellipse cx={36} cy={60} rx={24} ry={3} fill={color} opacity={0.12} />
      {artwork}
    </Svg>
  );
};

const StatusLabel = ({ status }) => {
  const tone =
    status === 'Resolved'
      ? '#507B60'
      : status === 'In Progress'
      ? COLORS.purple
      : '#976D30';

  return (
    <View style={styles.status}>
      <View style={[styles.statusDot, { backgroundColor: tone }]} />
      <Text style={[styles.statusText, { color: tone }]}>{status}</Text>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { userToken, userData } = useContext(AuthContext);

  const [incidents, setIncidents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      setIncidents(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  }, [userToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  }, [fetchIncidents]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleUpvote = async id => {
    try {
      setIncidents(prev =>
        prev.map(inc => {
          if (inc._id === id) {
            const hasUpvoted = inc.upvotes.includes(userData._id);

            const newUpvotes = hasUpvoted
              ? inc.upvotes.filter(uid => uid !== userData._id)
              : [...inc.upvotes, userData._id];

            return { ...inc, upvotes: newUpvotes };
          }

          return inc;
        }),
      );

      await axios.patch(
        `${API_URL}/${id}/upvote`,
        {},
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );
    } catch (error) {
      console.error(error);
      setInitialLoading(false);
      fetchIncidents();
    }
  };

  /*
   * Group reports for presentation only.
   * Preserve the server's order within each category.
   * Unexpected categories remain visible in the All view.
   */
  const sections = useMemo(() => {
    const groups = new Map(CATEGORIES.slice(1).map(category => [category, []]));

    incidents.forEach(incident => {
      const category = incident.category || 'Other';

      if (!groups.has(category)) {
        groups.set(category, []);
      }

      groups.get(category).push(incident);
    });

    return [...groups.entries()]
      .filter(
        ([category, reports]) =>
          reports.length > 0 &&
          (selectedCategory === 'All' || selectedCategory === category),
      )
      .map(([title, data], index) => ({
        key: title,
        title,
        data,
        stopNumber: index + 1,
      }));
  }, [incidents, selectedCategory]);

  const renderReport = ({ item, section, index }) => {
    const hasUpvoted = userData && item.upvotes.includes(userData._id);

    const meta = getCategoryMeta(section.title);
    const isLast = index === section.data.length - 1;

    return (
      <View style={styles.reportRow}>
        {/* Decorative path alongside each report */}
        <View style={styles.pathColumn} pointerEvents="none">
          <View style={styles.pathLine} />
          <View style={[styles.reportNode, { borderColor: meta.color }]} />
        </View>

        <View style={[styles.reportContent, !isLast && styles.reportDivider]}>
          <TouchableOpacity
            style={styles.reportMain}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Open report: ${item.title}`}
            onPress={() =>
              navigation.navigate('ReportDetail', {
                incidentId: item._id,
              })
            }
          >
            <View style={styles.reportCopy}>
              <StatusLabel status={item.status} />

              <Text style={styles.reportTitle} numberOfLines={3}>
                {item.title}
              </Text>

              <View style={styles.locationRow}>
                <MapPin size={13} color={COLORS.secondary} strokeWidth={1.7} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {item.location}
                </Text>
              </View>
            </View>

            {item.photo ? (
              <Image
                source={{ uri: item.photo }}
                style={styles.reportPhoto}
                resizeMode="cover"
              />
            ) : null}
          </TouchableOpacity>

          <View style={styles.reportFooter}>
            <View style={styles.reporter}>
              {item.reportedBy?.profilePhoto ? (
                <Image
                  source={{ uri: item.reportedBy.profilePhoto }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarLetter}>
                    {item.reportedBy?.name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}

              <View style={styles.reporterCopy}>
                <Text style={styles.reporterName} numberOfLines={1}>
                  {item.reportedBy?.name || 'Anonymous'}
                </Text>
                <Text style={styles.reporterMeta} numberOfLines={2}>
                  {item.reportedBy?.branch || 'Student'}
                  {' · '}
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.upvote, hasUpvoted && styles.upvoteActive]}
              onPress={() => handleUpvote(item._id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${
                hasUpvoted ? 'Remove upvote' : 'Upvote report'
              }. ${item.upvotes.length} upvotes`}
              accessibilityState={{ selected: Boolean(hasUpvoted) }}
            >
              <ThumbsUp
                size={16}
                strokeWidth={1.8}
                color={hasUpvoted ? COLORS.purple : COLORS.secondary}
              />
              <Text
                style={[
                  styles.upvoteText,
                  hasUpvoted && styles.upvoteTextActive,
                ]}
              >
                {item.upvotes.length}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => {
    const meta = getCategoryMeta(section.title);

    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionMarkerColumn}>
          <View
            style={[styles.sectionMarker, { backgroundColor: meta.background }]}
          >
            <Text style={[styles.sectionNumber, { color: meta.color }]}>
              {String(section.stopNumber).padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.sectionConnector} />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>
            {section.data.length}{' '}
            {section.data.length === 1 ? 'REPORT' : 'REPORTS'}
          </Text>

          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionSubtitle}>{meta.subtitle}</Text>
        </View>

        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <CategoryArt category={section.title} size={62} />
        </View>
      </View>
    );
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Activity size={21} color={COLORS.purple} />
            </View>
            <Text style={styles.brandText}>campus pulse</Text>
          </View>

          <Text style={styles.headerLabel}>OUR CAMPUS</Text>
        </View>

        {/* Illustrations act as category selectors */}
        <View style={styles.navigationStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(category => {
              const selected = selectedCategory === category;

              return (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryButton}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={
                    category === 'All'
                      ? 'Show all categories'
                      : `Show ${category} reports`
                  }
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.categoryArtContainer,
                      selected && styles.categoryArtSelected,
                    ]}
                  >
                    {category === 'All' ? (
                      <View style={styles.allIcon}>
                        <Compass
                          size={26}
                          color={COLORS.purple}
                          strokeWidth={1.5}
                        />
                      </View>
                    ) : (
                      <CategoryArt category={category} size={52} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.categoryLabel,
                      selected && styles.categoryLabelSelected,
                    ]}
                  >
                    {category === 'All' ? 'All stops' : category}
                  </Text>

                  <View
                    style={[
                      styles.categoryIndicator,
                      selected && styles.categoryIndicatorSelected,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../assets/animations/loading.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
            <Text style={styles.loadingText}>Catching up with campus…</Text>
          </View>
        ) : (
          <SectionList
            // Reset the scroll position when changing category.
            key={selectedCategory}
            style={styles.list}
            sections={sections}
            extraData={userData?._id}
            keyExtractor={item => item._id}
            renderItem={renderReport}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.purple]}
                tintColor={COLORS.purple}
              />
            }
            ListHeaderComponent={
              <View style={styles.intro}>
                <Text style={styles.introEyebrow}>THE CAMPUS WALK</Text>

                <View style={styles.introTitleRow}>
                  <Text style={styles.introTitle}>
                    Little stops.{'\n'}Meaningful changes.
                  </Text>
                  <ArrowUpRight size={27} color="#A99BBB" strokeWidth={1.3} />
                </View>

                <Text style={styles.introSubtitle}>
                  Explore reports across campus life.
                </Text>
              </View>
            }
            ListEmptyComponent={
              !refreshing ? (
                <View style={styles.emptyContainer}>
                  <Compass size={32} color={COLORS.purple} strokeWidth={1.4} />
                  <Text style={styles.emptyTitle}>A quiet stop.</Text>
                  <Text style={styles.emptyText}>
                    {selectedCategory === 'All'
                      ? 'No issues reported yet.'
                      : `No reports in ${selectedCategory} yet.`}
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              sections.length > 0 ? (
                <View style={styles.walkEnd}>
                  <View style={styles.endDot} />
                  <Text style={styles.endText}>
                    You’re caught up with this walk.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: COLORS.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: COLORS.text,
    flexShrink: 1,
  },
  headerLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: '#7C8277',
    marginLeft: 12,
  },

  navigationStrip: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingTop: 3,
    paddingBottom: 8,
  },
  categoryButton: {
    width: 92,
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 5,
  },
  categoryArtContainer: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryArtSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCD2EA',
  },
  allIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: COLORS.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 6,
  },
  categoryLabelSelected: {
    color: COLORS.purple,
    fontWeight: '600',
  },
  categoryIndicator: {
    width: 15,
    height: 3,
    borderRadius: 2,
    marginTop: 7,
    backgroundColor: 'transparent',
  },
  categoryIndicatorSelected: {
    backgroundColor: '#A595C2',
  },

  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  intro: {
    paddingTop: 25,
    paddingBottom: 12,
  },
  introEyebrow: {
    fontSize: 9,
    letterSpacing: 1.7,
    fontWeight: '600',
    color: '#867791',
    marginBottom: 10,
  },
  introTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  introTitle: {
    flex: 1,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -1,
    color: COLORS.text,
    paddingRight: 12,
  },
  introSubtitle: {
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.secondary,
    marginTop: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 23,
    paddingBottom: 17,
  },
  sectionMarkerColumn: {
    width: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionMarker: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sectionNumber: {
    fontSize: 10,
    fontWeight: '600',
  },
  sectionConnector: {
    position: 'absolute',
    top: 32,
    bottom: -17,
    left: 15,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D5CFDE',
  },
  sectionHeading: {
    flex: 1,
    paddingRight: 6,
  },
  sectionEyebrow: {
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 1.2,
    color: '#797B83',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.secondary,
    marginTop: 3,
  },

  reportRow: {
    flexDirection: 'row',
  },
  pathColumn: {
    width: 32,
    marginRight: 10,
    alignItems: 'center',
  },
  pathLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 15,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D5CFDE',
  },
  reportNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    backgroundColor: COLORS.background,
    marginTop: 19,
  },
  reportContent: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 14,
  },
  reportDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  reportMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 80,
  },
  reportCopy: {
    flex: 1,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  reportTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.25,
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  reportPhoto: {
    width: 74,
    height: 85,
    borderRadius: 9,
    marginLeft: 12,
    marginTop: 3,
    backgroundColor: '#ECECE6',
  },

  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },
  reporter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 9,
    marginRight: 6,
    backgroundColor: COLORS.lavender,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.purple,
  },
  reporterCopy: {
    flex: 1,
  },
  reporterName: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '500',
    color: '#575B67',
  },
  reporterMeta: {
    fontSize: 9,
    lineHeight: 14,
    color: '#777B83',
  },
  upvote: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upvoteActive: {
    backgroundColor: COLORS.lavender,
  },
  upvoteText: {
    fontSize: 11,
    color: COLORS.secondary,
    marginLeft: 5,
  },
  upvoteTextActive: {
    color: COLORS.purple,
  },

  walkEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingLeft: 12,
  },
  endDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BBCABD',
    marginRight: 22,
  },
  endText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 17,
    color: '#767E74',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 170,
    height: 170,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HomeScreen;
