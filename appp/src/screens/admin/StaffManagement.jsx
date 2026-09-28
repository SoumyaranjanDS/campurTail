import React, { useContext, useEffect, useState, useCallback } from 'react';
import { API_URL } from '../../config';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Image, StatusBar } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { ArrowLeft, Plus, ShieldCheck, Trash2 } from 'lucide-react-native';

const API = `${API_URL}/admin`;

const C = {
  background: '#FAFAF7',
  text: '#272D3B',
  secondary: '#717583',
  purple: '#6456B8',
  danger: '#EF4444',
  border: '#E1DFE7',
  white: '#FFFFFF',
};

const StaffManagement = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/staff`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setStaffList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/staff/${id}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      fetchStaff();
    } catch (e) {
      console.error('Failed to delete staff:', e);
    }
  };

  const renderStaff = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{item.name?.[0]}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.department}>{item.department || 'General'} Dept.</Text>
          <Text style={styles.empId}>Emp ID: {item.registrationNumber}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
        <Trash2 size={18} color={C.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Field Workers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateStaff')}>
          <Plus size={24} color={C.purple} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={staffList}
        keyExtractor={item => item._id}
        renderItem={renderStaff}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStaff(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyWrap}>
              <ShieldCheck size={40} color={C.secondary} opacity={0.5} />
              <Text style={styles.emptyText}>No field workers registered.</Text>
            </View>
          )
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
    alignItems: 'center',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text },
  
  list: { padding: 24, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEE7F7', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarInitials: { fontSize: 18, fontWeight: '700', color: C.purple },
  name: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 2 },
  department: { fontSize: 13, color: C.purple, fontWeight: '500', marginBottom: 2 },
  empId: { fontSize: 12, color: C.secondary },
  
  deleteBtn: { padding: 8 },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 12, color: C.secondary, fontSize: 15 },
});

export default StaffManagement;
