import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Image, Modal
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';
import { Plus, X, ArrowLeft } from 'lucide-react-native';

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

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  const confirmDelete = (id, name) => {
    setStaffToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const proceedDelete = async () => {
    if (!staffToDelete) return;
    setDeleteModalVisible(false);
    try {
      await axios.delete(`${API}/staff/${staffToDelete.id}`, { headers });
      setStaff(prev => prev.filter(s => s._id !== staffToDelete.id));
    } catch (e) {
      showAlert('Error', 'Failed to remove staff member.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Image source={{ uri: item.profilePhoto || getAvatar(item.name) }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.regNo}>{item.registrationNumber} • {item.branch}</Text>
        <View style={styles.branchWrap}>
          <Text style={styles.branchText}>{item.department}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => confirmDelete(item._id, item.name)}>
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

      {/* Delete Confirmation Modal */}
      <Modal transparent visible={deleteModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Remove Staff?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to remove {staffToDelete?.name} from staff?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalDelete]}
                onPress={proceedDelete}
              >
                <Text style={styles.modalDeleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 300, backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 8 },
  modalText: { fontSize: 14, color: C.secondary, textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalCancel: { backgroundColor: '#F2F1F4' },
  modalCancelText: { color: C.text, fontWeight: '600', fontSize: 14 },
  modalDelete: { backgroundColor: '#FF4B4B' },
  modalDeleteText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
});

export default AdminStaff;
