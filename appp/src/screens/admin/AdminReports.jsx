import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, TextInput, ScrollView
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Search, MapPin, CheckCircle2, Circle, Clock, ArrowLeft } from 'lucide-react-native';

const API = 'https://tails.inkedfact.online/api/v1/admin';
const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved'];

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

const AdminReports = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');

  const headers = { Authorization: `Bearer ${userToken}` };

  const fetchReports = useCallback(async () => {
    try {
      const params = {};
      if (selectedStatus !== 'All') params.status = selectedStatus;
      const { data } = await axios.get(`${API}/reports`, { headers, params });
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filtered = reports.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.reportedBy?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    if (status === 'Resolved') return C.green;
    if (status === 'In Progress') return '#E5A548';
    return C.secondary;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('ReportDetail', { incidentId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.rowHeader}>
        <View style={styles.categoryWrap}>
          <View style={[styles.categoryDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      
      <View style={styles.rowFooter}>
        <Text style={styles.reporterText}>By {item.reportedBy?.name}</Text>
        <View style={styles.locationWrap}>
          <MapPin size={12} color={C.secondary} />
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={C.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={C.secondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {STATUSES.map((s, index) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterBtn, 
              selectedStatus === s && styles.filterBtnActive,
              index !== STATUSES.length - 1 && { marginRight: 8 }
            ]}
            onPress={() => setSelectedStatus(s)}
          >
            <Text style={[styles.filterText, selectedStatus === s && styles.filterTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No reports found.</Text>}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: C.text, letterSpacing: -0.4 },
  
  searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, marginLeft: 10, color: C.text, fontSize: 15 },
  
  filterScroll: { flexGrow: 0, marginBottom: 16, maxHeight: 36 },
  filterContent: { paddingHorizontal: 24 },
  filterBtn: { 
    height: 36,
    minWidth: 80,
    paddingHorizontal: 16, 
    borderRadius: 18, 
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: C.lavender, borderColor: C.lavender },
  filterText: { fontSize: 13, color: C.secondary, fontWeight: '500' },
  filterTextActive: { color: C.purple },
  
  list: { paddingBottom: 40 },
  row: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { fontSize: 11, fontWeight: '700', color: C.secondary, letterSpacing: 0.5 },
  dateText: { fontSize: 12, color: C.secondary },
  
  title: { fontSize: 17, fontWeight: '500', color: C.text, letterSpacing: -0.3, marginBottom: 12, lineHeight: 24 },
  
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reporterText: { fontSize: 13, color: C.secondary },
  locationWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end', marginLeft: 16 },
  locationText: { fontSize: 13, color: C.secondary, flexShrink: 1 },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: C.secondary, fontSize: 14 },
});

export default AdminReports;
