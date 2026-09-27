import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Image, Dimensions
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { ShieldAlert, Users, ChevronRight } from 'lucide-react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const API = 'http://10.0.4.85:5000/api/v1/admin';

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

const AdminDashboard = ({ navigation }) => {
  const { userToken, userData, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${userToken}` };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/dashboard`, { headers });
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;
  };

  const resolutionRate = stats?.totalReports > 0 
    ? Math.round((stats.resolvedReports / stats.totalReports) * 100) 
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brand}>
            <ShieldAlert size={21} color={C.purple} strokeWidth={1.8} />
            <Text style={styles.brandText}>admin console</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileBtn} 
            onPress={() => navigation.navigate('AdminProfile')}
          >
            <Image 
              source={{ uri: userData?.profilePhoto || getAvatar(userData?.name) }} 
              style={styles.profileAvatar} 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerMain}>
          <Text style={styles.headerMainLight}>Welcome back,</Text>{'\n'}
          {userData?.name?.split(' ')[0] || 'Admin'} 👋
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color={C.purple} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statValue}>{stats?.pendingReports || 0}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>In Progress</Text>
                <Text style={styles.statValue}>{stats?.inProgressReports || 0}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total Reports</Text>
                <Text style={styles.statValue}>{stats?.totalReports || 0}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Resolved</Text>
                <Text style={styles.statValue}>{stats?.resolvedReports || 0}</Text>
              </View>
            </View>

            {/* Reports Graph */}
            <View style={styles.graphContainer}>
              <View style={styles.graphHeader}>
                <Text style={styles.graphTitle}>Reports Overview</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <BarChart
                  data={{
                    labels: ['Pending', 'In Prog', 'Resolved'],
                    datasets: [
                      {
                        data: [
                          stats?.pendingReports || 0,
                          stats?.inProgressReports || 0,
                          stats?.resolvedReports || 0
                        ],
                      },
                    ],
                  }}
                  width={screenWidth - 48}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  withHorizontalLabels={true}
                  showValuesOnTopOfBars={true}
                  fromZero={true}
                  chartConfig={{
                    backgroundColor: C.background,
                    backgroundGradientFrom: C.background,
                    backgroundGradientTo: C.background,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(100, 86, 184, ${opacity})`,
                    labelColor: (opacity = 1) => C.secondary,
                    barPercentage: 0.6,
                    fillShadowGradientFrom: C.purple,
                    fillShadowGradientFromOpacity: 0.8,
                    fillShadowGradientTo: C.purple,
                    fillShadowGradientToOpacity: 0.2,
                    propsForBackgroundLines: {
                      stroke: C.border,
                      strokeDasharray: '', // solid lines
                    }
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </View>
              <Text style={styles.graphCaption}>
                {resolutionRate}% success rate ({stats?.resolvedReports || 0} out of {stats?.totalReports || 0} resolved)
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Quick Links */}
            <TouchableOpacity 
              style={styles.actionRow} 
              onPress={() => navigation.navigate('StaffManagement')}
            >
              <View style={styles.actionLeft}>
                <View style={styles.actionIconWrap}>
                  <Users size={20} color={C.purple} strokeWidth={1.8} />
                </View>
                <View>
                  <Text style={styles.actionTitle}>Field Worker Management</Text>
                  <Text style={styles.actionSub}>
                    Track {stats?.totalStaff || 0} active staff members & assignments
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={C.secondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Recent Reports List */}
            <View style={styles.recentSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent updates</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AdminReports')}>
                  <Text style={styles.seeAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              
              {stats?.recentReports?.map(r => (
                <TouchableOpacity
                  key={r._id}
                  style={styles.reportRow}
                  onPress={() => navigation.navigate('ReportDetail', { incidentId: r._id })}
                >
                  <View style={styles.reportHeader}>
                    <View style={styles.reportCategory}>
                      <View style={[styles.categoryDot, { backgroundColor: r.status === 'Resolved' ? C.green : '#E5A548' }]} />
                      <Text style={styles.reportCategoryText}>{r.category.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.reportTime}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <Text style={styles.reportTitle} numberOfLines={1}>{r.title}</Text>
                  
                  <View style={styles.reportFooter}>
                    <Image 
                      source={{ uri: r.reportedBy?.profilePhoto || getAvatar(r.reportedBy?.name) }} 
                      style={styles.avatarMini} 
                    />
                    <Text style={styles.reportAuthor}>Reported by {r.reportedBy?.name?.split(' ')[0]}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: C.background,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandText: { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: 0.5, textTransform: 'uppercase' },
  profileBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18,
    backgroundColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  headerMain: { fontSize: 36, color: C.text, fontWeight: '700', lineHeight: 44, letterSpacing: -1 },
  headerMainLight: { fontWeight: '400', color: C.secondary },
  
  scroll: { paddingBottom: 40 },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  statBox: {
    width: '48%',
    marginBottom: 24,
  },
  statLabel: {
    fontSize: 12,
    color: C.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '300',
    color: C.text,
    letterSpacing: -1,
  },
  
  graphContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  graphTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  graphCaption: {
    fontSize: 12,
    color: C.secondary,
    textAlign: 'center',
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 24,
    marginBottom: 24,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 13,
    color: C.secondary,
  },

  recentSection: { paddingHorizontal: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: C.purple },
  
  reportRow: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  reportCategoryText: { fontSize: 12, fontWeight: '700', color: C.secondary, letterSpacing: 0.5 },
  reportTime: { fontSize: 12, color: '#A09CAB' },
  
  reportTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 12, lineHeight: 24 },
  
  reportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarMini: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E3DFE8' },
  reportAuthor: { fontSize: 13, color: C.secondary },
});

export default AdminDashboard;
