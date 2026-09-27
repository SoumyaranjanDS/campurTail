import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Image
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { TrendingUp, Users, ArrowLeft } from 'lucide-react-native';

const API = 'https://tails.inkedfact.online/api/v1/admin';

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

const AdminUsers = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = { Authorization: `Bearer ${userToken}` };

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/users`, { headers });
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const getAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Image source={{ uri: item.profilePhoto || getAvatar(item.name) }} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.regNo}>{item.registrationNumber} • {item.branch}</Text>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{item.totalReports}</Text>
          <Text style={styles.statLbl}>Reports</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: C.green }]}>{item.resolvedReports}</Text>
          <Text style={styles.statLbl}>Resolved</Text>
        </View>
        <View style={[styles.statBox, { alignItems: 'flex-end' }]}>
          <View style={styles.rateRow}>
            <TrendingUp size={14} color={item.resolutionRate >= 50 ? C.green : '#E5A548'} />
            <Text style={[styles.statNum, { color: item.resolutionRate >= 50 ? C.green : '#E5A548', marginLeft: 4 }]}>
              {item.resolutionRate}%
            </Text>
          </View>
          <Text style={styles.statLbl}>Success Rate</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Students</Text>
        <View style={styles.countPill}>
          <Users size={14} color={C.purple} />
          <Text style={styles.countText}>{users.length}</Text>
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No students registered.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text, letterSpacing: -0.4 },
  countPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.lavender, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  countText: { fontSize: 13, color: C.purple, fontWeight: '700' },
  
  list: { paddingBottom: 40 },
  row: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.border },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '500', color: C.text, letterSpacing: -0.3 },
  regNo: { fontSize: 13, color: C.secondary, marginTop: 2 },
  
  statsContainer: { flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F2F1F4' },
  statBox: { flex: 1 },
  statNum: { fontSize: 16, fontWeight: '600', color: C.text },
  statLbl: { fontSize: 12, color: C.secondary, fontWeight: '500', marginTop: 2 },
  rateRow: { flexDirection: 'row', alignItems: 'center' },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: C.secondary, fontSize: 14 },
});

export default AdminUsers;
