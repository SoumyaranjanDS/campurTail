import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { LogOut, ArrowLeft, Activity, CheckCircle2, Clock, MapPin } from 'lucide-react-native';
import axios from 'axios';

const API = 'http://10.0.4.85:5000/api/v1';

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
  white: '#FFFFFF',
  danger: '#EF4444',
};

const StaffProfile = ({ navigation }) => {
  const { userData, userToken, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [resolvedJobs, setResolvedJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        axios.get(`${API}/staff/stats`, { headers: { Authorization: `Bearer ${userToken}` } }),
        axios.get(`${API}/staff/reports`, { headers: { Authorization: `Bearer ${userToken}` } })
      ]);
      setStats(statsRes.data);
      
      const resolved = reportsRes.data.filter(r => r.status === 'Resolved' && r.assignedTo?._id === userData?._id || r.assignedTo === userData?._id);
      setResolvedJobs(resolved.slice(0, 5)); // Show max 5 recent
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [userToken, userData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileSection}>
        {userData?.profilePhoto ? (
          <Image source={{ uri: userData.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{userData?.name?.[0]}</Text>
          </View>
        )}
        <Text style={styles.name}>{userData?.name}</Text>
        <View style={styles.deptBadge}>
          <Text style={styles.deptText}>{userData?.department} Department</Text>
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Activity size={20} color={C.purple} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.totalAssigned || 0}</Text>
            <Text style={styles.statLabel}>Total Assigned</Text>
          </View>
          
          <View style={styles.statBox}>
            <CheckCircle2 size={20} color={C.green} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.resolved || 0}</Text>
            <Text style={styles.statLabel}>Jobs Resolved</Text>
          </View>
          
          <View style={styles.statBox}>
            <Clock size={20} color={C.amber} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.inProgress || 0}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Recently Resolved</Text>
        {resolvedJobs.length > 0 ? (
          resolvedJobs.map(job => (
            <TouchableOpacity 
              key={job._id} 
              style={styles.jobCard}
              onPress={() => navigation.navigate('ReportDetail', { incidentId: job._id })}
            >
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                <View style={styles.jobMeta}>
                  <MapPin size={12} color={C.secondary} />
                  <Text style={styles.jobLocation} numberOfLines={1}>{job.location}</Text>
                </View>
              </View>
              <View style={styles.jobCheck}>
                <CheckCircle2 size={20} color={C.green} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyHistory}>No recently resolved jobs.</Text>
        )}
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color={C.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    alignItems: 'center',
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text },
  
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 16 },
  avatarPlaceholder: { 
    width: 90, height: 90, borderRadius: 45, 
    backgroundColor: C.lavender, 
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16 
  },
  avatarInitials: { color: C.purple, fontSize: 32, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 6 },
  deptBadge: { backgroundColor: C.lavender, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  deptText: { color: C.purple, fontSize: 13, fontWeight: '600' },
  
  statsSection: { padding: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { 
    flex: 1, 
    backgroundColor: C.white, 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: { marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4 },
  statLabel: { fontSize: 11, color: C.secondary, textAlign: 'center', fontWeight: '500' },
  
  actionsSection: { paddingHorizontal: 24, marginTop: 20, marginBottom: 40 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { color: C.danger, fontSize: 16, fontWeight: '600' },
  
  historySection: { paddingHorizontal: 24, marginTop: 10 },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  jobInfo: { flex: 1, marginRight: 16 },
  jobTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 4 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobLocation: { fontSize: 12, color: C.secondary, flexShrink: 1 },
  jobCheck: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  emptyHistory: { color: C.secondary, fontSize: 14, fontStyle: 'italic', marginTop: 8 },
});

export default StaffProfile;
