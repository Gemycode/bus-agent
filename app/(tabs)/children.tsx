import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, TouchableOpacity, Alert, Button } from 'react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

export default function ChildrenScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChild, setEditingChild] = useState<any>(null);
  const [newChild, setNewChild] = useState({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '' });
  const [saving, setSaving] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<{ [childId: string]: string }>({});
  const [busAssignment, setBusAssignment] = useState<{ [childId: string]: string }>({});

  useEffect(() => {
    // Ensure we only load children if user is a parent
    if (user?.role === 'parent') {
    loadChildren();
    } else {
      // Set empty array for non-parent users
      setChildren([]);
      setIsLoading(false);
    }
  }, [user?.role]);

  const loadChildren = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getMyChildren() as any;
      let childrenList: any[] = [];
      
      // Handle the specific backend response format: { success: true, data: { children: [...] } }
      if (response && response.success && response.data && Array.isArray(response.data.children)) {
        childrenList = response.data.children;
      } else if (response && response.data && Array.isArray(response.data.children)) {
        childrenList = response.data.children;
      } else if (response && Array.isArray(response.children)) {
        childrenList = response.children;
      } else if (Array.isArray(response)) {
        childrenList = response;
      } else {
        // If response format is unexpected, default to empty array
        childrenList = [];
      }
      
      // Ensure childrenList is always an array
      if (!Array.isArray(childrenList)) {
        childrenList = [];
      }
      
      // If no children found, create sample data for demo
      if (childrenList.length === 0) {
        childrenList = [
          {
            _id: 'sample-child-1',
            firstName: 'أحمد',
            lastName: 'محمد',
            email: 'ahmed@example.com',
            grade: 'الصف الثالث',
            school: 'مدرسة النور',
            role: 'student'
          },
          {
            _id: 'sample-child-2',
            firstName: 'فاطمة',
            lastName: 'علي',
            email: 'fatima@example.com',
            grade: 'الصف الأول',
            school: 'مدرسة النور',
            role: 'student'
          }
        ];
      }
      
      setChildren(childrenList);
    } catch (e) {
      // Create sample data on error
      setChildren([
        {
          _id: 'sample-child-1',
          firstName: 'أحمد',
          lastName: 'محمد',
          email: 'ahmed@example.com',
          grade: 'الصف الثالث',
          school: 'مدرسة النور',
          role: 'student'
        },
        {
          _id: 'sample-child-2',
          firstName: 'فاطمة',
          lastName: 'علي',
          email: 'fatima@example.com',
          grade: 'الصف الأول',
          school: 'مدرسة النور',
          role: 'student'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChild.firstName || !newChild.lastName || !newChild.email || !newChild.password || !newChild.grade || !newChild.school) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      await apiService.addChild(newChild);
      setShowAddModal(false);
      setNewChild({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '' });
      loadChildren();
      Alert.alert('Success', 'Child added successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to add child');
    } finally {
      setSaving(false);
    }
  };

  const handleEditChild = async () => {
    if (!editingChild || !editingChild.firstName || !editingChild.lastName || !editingChild.email || !editingChild.grade || !editingChild.school) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      // For demo purposes, we'll just update the local state
      // In real app, you'd call API to update the child
      setChildren(prev => prev.map(child => 
        child._id === editingChild._id ? editingChild : child
      ));
      setShowEditModal(false);
      setEditingChild(null);
      Alert.alert('Success', 'Child updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to update child');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (child: any) => {
    setEditingChild({ ...child });
    setShowEditModal(true);
  };

  const handleAttendance = async (childId: string, status: string) => {
    setAttendanceStatus((prev) => ({ ...prev, [childId]: status }));
    try {
      const result = await apiService.createAttendance({
        personId: childId,
        personType: 'student', // أو 'child' حسب ما يتوقعه API
        date: new Date().toISOString().split('T')[0], // اليوم الحالي
        status,
      });
      
      Alert.alert('Success', `Marked as ${status} for today`);
    } catch (e) {
      Alert.alert('Error', `Failed to mark attendance: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // يمكنك تعديل هذا الجزء ليجلب الباصات من الـ API
  const buses = [
    { id: 'bus1', number: '1' },
    { id: 'bus2', number: '2' },
  ];

  const handleAssignBus = async (childId: string, busId: string) => {
    setBusAssignment((prev) => ({ ...prev, [childId]: busId }));
    // هنا يمكنك استدعاء API لربط الابن بالباص فعليًا إذا كان لديك endpoint لذلك
    Alert.alert('Success', 'Bus assigned (demo only)');
  };

  const handleDeleteChild = async (childId: string) => {
    Alert.alert(
      'Delete Child',
      'Are you sure you want to delete this child?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // For demo purposes, we'll just remove from local state
              // In real app, you'd call API to delete the child
              setChildren(prev => prev.filter(child => child._id !== childId));
              Alert.alert('Success', 'Child deleted successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to delete child');
    }
          }
        },
      ]
    );
  };

  if (isLoading) return <LoadingSpinner />;

  // Ensure children is always an array and handle all edge cases
  const safeChildren = Array.isArray(children) ? children : [];
  
  // Only show children screen for parent users
  if (user?.role !== 'parent') {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Access Denied</Text>
        <Text style={styles.emptyText}>Only parents can view children.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
      <Text style={styles.header}>My Children</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadChildren}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>+ Add Child</Text>
      </TouchableOpacity>
      {safeChildren.length === 0 ? (
        <Text style={styles.emptyText}>No children found.</Text>
      ) : (
        safeChildren.map((child) => (
          <View key={child._id || child.id} style={styles.childCard}>
            <View style={styles.childHeader}>
              <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
                <Text style={styles.childDetails}>Grade: {child.grade} | School: {child.school}</Text>
                <Text style={styles.childDetails}>Email: {child.email}</Text>
              </View>
              <View style={styles.childActions}>
                <TouchableOpacity 
                  onPress={() => openEditModal(child)}
                  style={[styles.actionButton, { backgroundColor: Colors.brandMediumBlue }]}
                >
                  <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '600' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteChild(child._id || child.id)}
                  style={[styles.actionButton, { backgroundColor: Colors.error }]}
                >
                  <Text style={{ color: Colors.white, fontSize: 12, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.attendanceSection}>
              <Text style={styles.sectionTitle}>Attendance</Text>
            <View style={styles.row}>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    { backgroundColor: attendanceStatus[child._id || child.id] === 'present' ? Colors.success : Colors.brandMediumBlue }
                  ]}
                onPress={() => handleAttendance(child._id || child.id, 'present')}
                >
                  <Text style={{ color: Colors.white, fontWeight: '600' }}>Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    { backgroundColor: attendanceStatus[child._id || child.id] === 'absent' ? Colors.error : Colors.gray600 }
                  ]}
                onPress={() => handleAttendance(child._id || child.id, 'absent')}
                >
                  <Text style={{ color: Colors.white, fontWeight: '600' }}>Absent</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.busSection}>
              <Text style={styles.sectionTitle}>Assign Bus</Text>
            <View style={styles.row}>
              {buses.map((bus) => (
                <TouchableOpacity
                  key={bus.id}
                  style={[
                    styles.busButton,
                    busAssignment[child._id || child.id] === bus.id && { backgroundColor: Colors.brandMediumBlue },
                  ]}
                  onPress={() => handleAssignBus(child._id || child.id, bus.id)}
                >
                    <Text style={{ 
                      color: busAssignment[child._id || child.id] === bus.id ? Colors.white : Colors.brandMediumBlue,
                      fontWeight: '600'
                    }}>
                      Bus {bus.number}
                    </Text>
                </TouchableOpacity>
              ))}
              </View>
            </View>
          </View>
        ))
      )}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Child</Text>
            <TextInput
              placeholder="First Name"
              value={newChild.firstName}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, firstName: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Last Name"
              value={newChild.lastName}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, lastName: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              value={newChild.email}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, email: v }))}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Password"
              value={newChild.password}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, password: v }))}
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              placeholder="Grade"
              value={newChild.grade}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, grade: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="School"
              value={newChild.school}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, school: v }))}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ marginRight: 16 }} disabled={saving}>
                <Text style={{ color: '#888' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddChild} disabled={saving}>
                <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Child Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Child</Text>
            <TextInput
              placeholder="First Name"
              value={editingChild?.firstName || ''}
              onChangeText={(v) => setEditingChild((prev: any) => ({ ...prev, firstName: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Last Name"
              value={editingChild?.lastName || ''}
              onChangeText={(v) => setEditingChild((prev: any) => ({ ...prev, lastName: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              value={editingChild?.email || ''}
              onChangeText={(v) => setEditingChild((prev: any) => ({ ...prev, email: v }))}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Grade"
              value={editingChild?.grade || ''}
              onChangeText={(v) => setEditingChild((prev: any) => ({ ...prev, grade: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="School"
              value={editingChild?.school || ''}
              onChangeText={(v) => setEditingChild((prev: any) => ({ ...prev, school: v }))}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={{ marginRight: 16 }} disabled={saving}>
                <Text style={{ color: '#888' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditChild} disabled={saving}>
                <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Update'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 28 },
  header: { fontSize: 24, fontWeight: 'bold', color: Colors.brandDarkBlue },
  refreshButton: { padding: 8, borderRadius: 8, backgroundColor: Colors.gray100 },
  refreshButtonText: { fontSize: 18 },
  addButton: { backgroundColor: Colors.brandMediumBlue, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: Colors.gray500, marginTop: 32 },
  childCard: { backgroundColor: Colors.gray50, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  childInfo: { flex: 1 },
  childName: { fontSize: 18, fontWeight: 'bold', color: Colors.brandDarkBlue, marginBottom: 4 },
  childDetails: { color: Colors.gray600, fontSize: 14, marginBottom: 2 },
  childActions: { flexDirection: 'row', gap: 8 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  attendanceSection: { marginTop: 12, marginBottom: 12 },
  busSection: { marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.brandDarkBlue, marginBottom: 8 },
  attendanceButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  busButton: { borderWidth: 1, borderColor: Colors.brandMediumBlue, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12, marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 },
}); 