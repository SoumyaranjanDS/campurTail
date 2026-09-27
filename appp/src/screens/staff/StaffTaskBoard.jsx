import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Image
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Briefcase, MapPin, CheckCircle2, Clock, PlayCircle } from 'lucide-react-native';

const API = 'http://10.0.4.85:5000/api/v1/staff';
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
  white: '#FFFFFF',
};

const StaffTaskBoard = ({ navigation }) => {
  const { userToken, userData } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Pending');

  const headers = { Authorization: `Bearer ${userToken}` };

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/reports`, { headers });
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = reports.filter(r => r.status === selectedStatus);

  const getStatusIcon = (status) => {
    if (status === 'Resolved') return <CheckCircle2 size={16} color={C.green} />;
    if (status === 'In Progress') return <PlayCircle size={16} color={C.amber} />;
    return <Clock size={16} color={C.secondary} />;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReportDetail', { incidentId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.priority.toUpperCase()} PRIORITY</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      
      <View style={styles.locationWrap}>
        <MapPin size={14} color={C.secondary} />
        <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.statusWrap}>
          {getStatusIcon(item.status)}
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Text style={styles.actionText}>View Job Details &rarr;</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Task Board</Text>
          <Text style={styles.headerSubtitle}>{userData?.department} Department</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
          {userData?.profilePhoto ? (
            <Image source={{ uri: userData.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{userData?.name?.[0]}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {STATUSES.map((status) => {
          const count = reports.filter(r => r.status === status).length;
          const isActive = selectedStatus === status;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {status} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Briefcase size={40} color={C.secondary} opacity={0.5} />
            <Text style={styles.emptyText}>No {selectedStatus.toLowerCase()} jobs.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: C.purple, fontWeight: '600', marginTop: 4 },
  
  avatarBtn: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.lavender, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: C.purple, fontSize: 16, fontWeight: '600' },
  
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: C.purple },
  tabText: { fontSize: 14, fontWeight: '600', color: C.secondary },
  tabTextActive: { color: C.purple },
  
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { backgroundColor: C.lavender, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.purple, letterSpacing: 0.5 },
  dateText: { fontSize: 12, color: C.secondary, fontWeight: '500' },
  
  title: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 10, lineHeight: 22 },
  
  locationWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 6 },
  locationText: { fontSize: 13, color: C.secondary, flexShrink: 1 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, fontWeight: '600', color: C.text },
  actionText: { fontSize: 13, fontWeight: '600', color: C.purple },
  
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 12, fontSize: 15, color: C.secondary, fontWeight: '500' },
});

export default StaffTaskBoard;
