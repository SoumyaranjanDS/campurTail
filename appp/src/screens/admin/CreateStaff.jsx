import React, { useContext, useState } from 'react';
import { API_URL } from '../../config';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';
import { ArrowLeft, Check } from 'lucide-react-native';

const API = `${API_URL}/admin`;
const DEPARTMENTS = ["Infrastructure", "Academics", "Hostel", "Cleanliness", "Security", "Other"];

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

const CreateStaff = ({ navigation, route }) => {
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${userToken}` };

  const handleCreate = async () => {
    if (!name.trim() || !regNo.trim() || !branch.trim() || !department) {
      showAlert('Missing Fields', 'Please fill in all fields including department.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/staff`, { name, registrationNumber: regNo, branch, department }, { headers });
      route.params?.onCreated?.();
      navigation.goBack();
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Failed to create staff.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Staff</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.sectionLabel}>STAFF DETAILS</Text>
        <View style={styles.formSection}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={C.secondary}
            value={name}
            onChangeText={setName}
          />
          
          <Text style={styles.label}>Login ID (Registration Number)</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="STAFF123"
            placeholderTextColor={C.secondary}
            value={regNo}
            onChangeText={setRegNo}
            autoCapitalize="characters"
          />
          <Text style={styles.label}>Branch / Title</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]}
            placeholder="e.g. Maintenance"
            placeholderTextColor={C.secondary}
            value={branch}
            onChangeText={setBranch}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>DEPARTMENT (CATEGORY)</Text>
        <View style={styles.branchGrid}>
          {DEPARTMENTS.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.branchChip, department === d && styles.branchChipActive]}
              onPress={() => setDepartment(d)}
              activeOpacity={0.7}
            >
              <Text style={[styles.branchChipText, department === d && styles.branchChipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4, marginLeft: -4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text, letterSpacing: -0.4 },
  
  saveBtn: { backgroundColor: C.purple, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  saveBtnText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9DA3B4', letterSpacing: 1, marginBottom: 16 },
  
  formSection: {
    paddingBottom: 16,
  },
  label: { fontSize: 12, fontWeight: '500', color: C.secondary, marginBottom: 8 },
  input: { 
    minHeight: 51,
    borderBottomWidth: 1,
    borderBottomColor: '#D2CCD9',
    paddingHorizontal: 2,
    paddingVertical: 13,
    fontSize: 15,
    color: C.text,
    marginBottom: 24,
  },
  
  divider: { height: 1, backgroundColor: C.border, marginVertical: 32 },
  
  branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  branchChip: {
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
  },
  branchChipActive: { backgroundColor: C.lavender, borderColor: C.lavender },
  branchChipText: { fontSize: 14, color: C.secondary, fontWeight: '500' },
  branchChipTextActive: { color: C.purple, fontWeight: '600' },
});

export default CreateStaff;
