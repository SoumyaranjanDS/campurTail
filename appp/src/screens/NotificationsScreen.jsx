import React, { useState, useEffect, useContext, useCallback } from 'react';
import { API_URL } from '../config';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, ArrowUpRight, Bell, CheckCheck } from 'lucide-react-native';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';
import Screen from '../components/Screen';

const API = `${API_URL}/notifications`;

const C = {
  background: '#FAFAF7',
  white: '#FFFFFF',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  lavender: '#EEE7F7',
  mint: '#E7F0E5',
  green: '#507B60',
  border: '#E1DFE7',
};

const formatTime = value => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const time = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (date.toDateString() === today.toDateString()) {
    return `Today · ${time}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday · ${time}`;
  }

  const day = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });

  return `${day} · ${time}`;
};

const NotificationsScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = notifications.filter(item => !item.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      setError('');

      const response = await axios.get(API, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      setNotifications(response.data);
    } catch (err) {
      console.error(err);
      setError('Couldn’t load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;

    setMarkingAll(true);

    try {
      setError('');

      await axios.patch(
        `${API}/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      setNotifications(previous =>
        previous.map(item => ({
          ...item,
          isRead: true,
        })),
      );
    } catch (err) {
      console.error(err);
      setError('Couldn’t mark notifications as read. Please try again.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePress = async item => {
    if (!item.isRead) {
      try {
        await axios.patch(
          `${API}/${item._id}/read`,
          {},
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          },
        );

        setNotifications(previous =>
          previous.map(notification =>
            notification._id === item._id
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    }

    if (item.referenceId) {
      if (item.type === 'chat') {
        navigation.navigate('IssueChat', {
          incidentId: item.referenceId,
        });
      } else {
        navigation.navigate('ReportDetail', {
          incidentId: item.referenceId,
        });
      }
    }
  };

  const renderItem = ({ item }) => {
    const unread = !item.isRead;

    return (
      <TouchableOpacity
        style={styles.notificationRow}
        onPress={() => handlePress(item)}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel={`${unread ? 'Unread. ' : ''}${item.title}. ${
          item.body || ''
        }`}
        accessibilityHint={
          item.referenceId
            ? 'Opens the related report'
            : unread
            ? 'Marks this notification as read'
            : undefined
        }
      >
        <View
          style={[
            styles.notificationIcon,
            unread && styles.notificationIconUnread,
          ]}
        >
          <Bell
            size={19}
            color={unread ? C.purple : C.secondary}
            strokeWidth={1.6}
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>

            {unread ? (
              <View style={styles.unreadLabel}>
                <View style={styles.unreadDot} />
                <Text style={styles.unreadLabelText}>Unread</Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.notificationTitle,
              unread && styles.notificationTitleUnread,
            ]}
          >
            {item.title}
          </Text>

          {item.body ? (
            <Text style={styles.notificationBody}>{item.body}</Text>
          ) : null}

          {item.referenceId ? (
            <View style={styles.reportLink}>
              <Text style={styles.reportLinkText}>{item.type === 'chat' ? 'View message' : 'View report'}</Text>
              <ArrowUpRight size={14} color={C.purple} strokeWidth={1.7} />
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const emptyContent = loading ? (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="small" color={C.purple} />
      <Text style={styles.loadingText}>Loading your notifications…</Text>
    </View>
  ) : error ? null : (
    <View style={styles.stateContainer}>
      <View style={styles.emptyArtwork}>
        <View style={styles.emptyBackShape} />

        <View style={styles.emptyBell}>
          <Bell size={32} color={C.purple} strokeWidth={1.4} />
        </View>

        <View style={styles.emptyAccent} />
      </View>

      <Text style={styles.emptyTitle}>No notifications yet</Text>

      <Text style={styles.emptyDescription}>
        Updates about your reports will appear here.
      </Text>

      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <ArrowLeft size={16} color={C.purple} strokeWidth={1.7} />
        <Text style={styles.emptyButtonText}>Go back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen>
      <View style={styles.container}>
        {/* Screen already provides the existing safe-area wrapper. */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={C.text} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.brandLabel}>CAMPUS TRAIL</Text>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
        </View>

        <FlatList
          style={styles.list}
          data={notifications}
          keyExtractor={item => String(item._id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.purple]}
              tintColor={C.purple}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.introText}>
                Keep track of updates about your campus reports.
              </Text>

              {!loading && notifications.length > 0 ? (
                <View style={styles.toolbar}>
                  <View style={styles.unreadSummary}>
                    <View
                      style={[
                        styles.summaryDot,
                        unreadCount === 0 && styles.summaryDotRead,
                      ]}
                    />

                    <Text style={styles.summaryText}>
                      {unreadCount > 0
                        ? `${unreadCount} unread`
                        : 'All notifications read'}
                    </Text>
                  </View>

                  {unreadCount > 0 ? (
                    <TouchableOpacity
                      style={styles.markAllButton}
                      onPress={handleMarkAllRead}
                      disabled={markingAll}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Mark all notifications as read"
                      accessibilityState={{
                        disabled: markingAll,
                        busy: markingAll,
                      }}
                    >
                      {markingAll ? (
                        <ActivityIndicator
                          size="small"
                          color={C.purple}
                          style={styles.markAllIcon}
                        />
                      ) : (
                        <CheckCheck
                          size={17}
                          color={C.purple}
                          strokeWidth={1.8}
                          style={styles.markAllIcon}
                        />
                      )}

                      <Text style={styles.markAllText}>
                        {markingAll ? 'Marking…' : 'Mark all as read'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorNotice}>
                  <Text style={styles.errorText}>{error}</Text>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRefresh}
                    disabled={refreshing}
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryText}>
                      {refreshing ? 'Refreshing…' : 'Refresh'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={emptyContent}
          ListFooterComponent={
            notifications.length > 0 ? (
              <View style={styles.footer}>
                <View style={styles.footerLine} />
                <Text style={styles.footerText}>
                  You’ve reached the end of your notifications.
                </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#F3EEF8',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4DBEC',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  headerCopy: {
    flex: 1,
  },
  brandLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.8,
    color: C.purple,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: C.text,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listHeader: {
    paddingTop: 20,
  },
  introText: {
    fontSize: 13,
    lineHeight: 21,
    color: C.secondary,
    marginBottom: 13,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  unreadSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginRight: 12,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.purple,
    marginRight: 7,
  },
  summaryDotRead: {
    backgroundColor: C.green,
  },
  summaryText: {
    color: C.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  markAllButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  markAllIcon: {
    marginRight: 6,
  },
  markAllText: {
    color: C.purple,
    fontSize: 12,
    fontWeight: '500',
  },

  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EFEEE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  notificationIconUnread: {
    backgroundColor: C.lavender,
  },
  notificationContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  timeText: {
    fontSize: 10,
    lineHeight: 16,
    color: C.secondary,
    marginRight: 10,
  },
  unreadLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.purple,
    marginRight: 4,
  },
  unreadLabelText: {
    color: C.purple,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '500',
  },
  notificationTitle: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '500',
    color: C.text,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 13,
    lineHeight: 21,
    color: C.secondary,
    marginTop: 5,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },
  reportLinkText: {
    fontSize: 11,
    fontWeight: '500',
    color: C.purple,
    marginRight: 4,
  },

  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 50,
  },
  loadingText: {
    fontSize: 12,
    color: C.secondary,
    marginTop: 14,
  },
  emptyArtwork: {
    width: 105,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyBackShape: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 25,
    backgroundColor: C.mint,
    transform: [{ rotate: '13deg' }],
    top: 18,
    left: 25,
  },
  emptyBell: {
    width: 70,
    height: 70,
    borderRadius: 25,
    backgroundColor: C.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  emptyAccent: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B8CEAE',
    right: 7,
    top: 8,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 20,
    letterSpacing: -0.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyDescription: {
    color: C.secondary,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
    maxWidth: 270,
  },
  emptyButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    paddingHorizontal: 12,
  },
  emptyButtonText: {
    color: C.purple,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 7,
  },

  errorNotice: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  errorText: {
    color: '#976D30',
    fontSize: 13,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    color: C.purple,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  footerLine: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#C6D4C1',
    marginBottom: 12,
  },
  footerText: {
    color: C.secondary,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
