import React, { useContext, useState } from 'react';
import { API_URL } from '../../config';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { AlertContext } from '../../context/AlertContext';
import { ArrowLeft, User, MapPin, Clock, CircleAlert, CheckCircle2 } from 'lucide-react-native';

const API = `${API_URL}/admin`;
const STATUSES = ['Pending', 'In Progress', 'Resolved'];

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

const STATUS_COLORS = { Pending: C.secondary, 'In Progress': '#E5A548', Resolved: C.green };

const AdminReportDetail = ({ navigation, route }) => {
  const { userToken } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const [report, setReport] = useState(route.params.report);
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${userToken}` };

  const updateStatus = async (status) => {
    setSaving(true);
    try {
      const { data } = await axios.patch(`${API}/reports/${report._id}/status`, { status }, { headers });
      setReport(data);
      showAlert('Updated', `Status changed to ${status}`, 'success');
    } catch (e) {
      showAlert('Error', 'Failed to update status', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{report.category}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        <View style={styles.contentPad}>
          <Text style={styles.title}>{report.title}</Text>
          
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: priorityBg(report.priority) }]}>
              <Text style={[styles.badgeText, { color: priorityColor(report.priority) }]}>{report.priority} Priority</Text>
            </View>
          </View>
        </View>

        {/* Photo */}
        {report.photo ? (
          <Image source={{ uri: report.photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.noPhoto}>
            <CircleAlert size={24} color={C.secondary} />
            <Text style={styles.noPhotoText}>No photo provided</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.contentPad}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.description}>{report.description || 'No description provided.'}</Text>

          {/* Landmark Details */}
          {(report.landmarkText || (report.landmarkImages && report.landmarkImages.length > 0)) ? (
            <View style={{ marginTop: 20, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <MapPin size={14} color="#6456B8" strokeWidth={1.7} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#272D3B', marginLeft: 6 }}>Landmark Details</Text>
              </View>

              {report.landmarkText ? (
                <Text style={{ fontSize: 13, lineHeight: 21, color: '#717583', marginBottom: 12 }}>
                  {report.landmarkText}
                </Text>
              ) : null}

              {report.landmarkImages && report.landmarkImages.length > 0 ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {report.landmarkImages.map((imgUrl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.85}
                      onPress={() => setFullscreenImage && setFullscreenImage(imgUrl)}
                    >
                      <Image
                        source={{ uri: imgUrl }}
                        style={{ width: 110, height: 110, borderRadius: 14, backgroundColor: '#EEE7F7' }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          
          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>DETAILS</Text>
          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <User size={18} color={C.secondary} />
              <View style={styles.metaContent}>
                <Text style={styles.metaValue}>{report.reportedBy?.name}</Text>
                <Text style={styles.metaLabel}>{report.reportedBy?.registrationNumber || 'Staff'}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={18} color={C.secondary} />
              <View style={styles.metaContent}>
                <Text style={styles.metaValue}>{report.location}</Text>
                <Text style={styles.metaLabel}>Location</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Clock size={18} color={C.secondary} />
              <View style={styles.metaContent}>
                <Text style={styles.metaValue}>{new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                <Text style={styles.metaLabel}>Reported At</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />
          
          {/* Status Selector */}
          <Text style={styles.sectionLabel}>UPDATE STATUS</Text>
          <View style={styles.statusRow}>
            {STATUSES.map(s => {
              const isActive = report.status === s;
              const color = isActive ? STATUS_COLORS[s] : C.secondary;
              const bg = isActive ? (s === 'Resolved' ? C.mint : (s === 'In Progress' ? '#FCF1E3' : '#F2F1F4')) : 'transparent';
              
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusBtn,
                    isActive && { backgroundColor: bg, borderColor: color },
                  ]}
                  onPress={() => updateStatus(s)}
                  disabled={saving || isActive}
                >
                  {saving && isActive ? (
                    <ActivityIndicator size="small" color={color} />
                  ) : (
                    <>
                      {isActive && s === 'Resolved' && <CheckCircle2 size={14} color={color} style={{ marginRight: 6 }} />}
                      <Text style={[styles.statusBtnText, { color: color, fontWeight: isActive ? '600' : '500' }]}>{s}</Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const priorityColor = p => ({ Low: C.green, Medium: '#B57C26', High: '#C25454', Critical: '#8D4361' }[p] || C.secondary);
const priorityBg = p => ({ Low: C.mint, Medium: '#FDF5E6', High: '#FDF0F0', Critical: '#F7EDF1' }[p] || C.lavender);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 13, fontWeight: '700', color: C.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  scroll: { paddingBottom: 60 },
  contentPad: { paddingHorizontal: 24, paddingTop: 16 },
  
  title: { fontSize: 28, fontWeight: '600', color: C.text, letterSpacing: -0.8, lineHeight: 34, marginBottom: 16 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  badge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  
  photo: { width: '100%', height: 260, backgroundColor: C.border },
  noPhoto: { width: '100%', height: 160, backgroundColor: '#F2F1F4', justifyContent: 'center', alignItems: 'center', gap: 8 },
  noPhotoText: { fontSize: 13, color: C.secondary, fontWeight: '500' },
  
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9DA3B4', letterSpacing: 1, marginBottom: 16 },
  description: { fontSize: 16, color: C.text, lineHeight: 26 },
  
  divider: { height: 1, backgroundColor: C.border, marginVertical: 32 },
  
  metaList: { gap: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  metaContent: { flex: 1, marginTop: -2 },
  metaValue: { fontSize: 15, color: C.text, fontWeight: '500', marginBottom: 2 },
  metaLabel: { fontSize: 13, color: C.secondary },
  
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1, 
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1, 
    borderColor: C.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  statusBtnText: { fontSize: 13 },
});

export default AdminReportDetail;
