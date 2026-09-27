import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Image
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';
import { Plus, X, ArrowLeft } from 'lucide-react-native';

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

const AdminStaff = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = { Authorization: `Bearer ${userToken}` };

  const fetchStaff = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/staff`, { headers });
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, []);

  const getAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Staff')}&background=random&color=fff`;
  };

  const deleteStaff = async (id, name) => {
    showAlert(
      'Remove Staff?',
      `Remove ${name} from staff?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            try {
              await axios.delete(`${API}/staff/${id}`, { headers });
              setStaff(prev => prev.filter(s => s._id !== id));
            } catch (e) {
              showAlert('Error', 'Failed to remove staff member.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Image source={{ uri: item.profilePhoto || getAvatar(item.name) }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.regNo}>{item.registrationNumber}</Text>
        <View style={styles.branchWrap}>
          <Text style={styles.branchText}>{item.branch}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => deleteStaff(item._id, item.name)}>
        <X size={20} color={C.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateStaff', { onCreated: fetchStaff })}>
          <Plus size={20} color="#FFF" />
          <Text style={styles.addText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={staff}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStaff(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No staff members added.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4, marginLeft: -4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text, letterSpacing: -0.4 },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.purple, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  addText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  
  list: { paddingBottom: 40 },
  row: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.border },
  info: { flex: 1, paddingLeft: 16 },
  name: { fontSize: 17, fontWeight: '500', color: C.text, letterSpacing: -0.3 },
  regNo: { fontSize: 13, color: C.secondary, marginTop: 2, marginBottom: 8 },
  branchWrap: { alignSelf: 'flex-start', backgroundColor: C.lavender, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  branchText: { fontSize: 11, fontWeight: '700', color: C.purple, letterSpacing: 0.5, textTransform: 'uppercase' },
  
  removeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F1F4', justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, color: C.secondary, fontSize: 14 },
});

export default AdminStaff;
