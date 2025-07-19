import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Button, useColorScheme, TouchableOpacity, Image } from 'react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { refreshParentDashboard } from './index';

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  attendanceStatus?: string; // 'present' | 'absent' | undefined
};

export default function StudentAttendanceListScreen() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({}); // studentId -> status
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null); // studentId being updated
  const colorScheme = useColorScheme();

  // جلب الأطفال وحضورهم الفعلي
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. جلب الأطفال
        const res: any = await apiService.getMyChildren?.();
        let childrenList: Student[] = [];
        if (res && res.success && res.data && Array.isArray((res.data as any).children)) {
          childrenList = (res.data as any).children;
        } else if (res && Array.isArray((res as any).children)) {
          childrenList = (res as any).children;
        } else if (Array.isArray(res)) {
          childrenList = res;
        }
        setStudents(childrenList);

        // 2. جلب حضور الأطفال لهذا اليوم
        const attendances: any = await apiService.getParentAttendances?.();
        const today = new Date().toISOString().slice(0, 10);
        const map: Record<string, string> = {};
        if (Array.isArray(attendances)) {
          attendances.forEach((a: any) => {
            // تحقق من أن الحضور لهذا اليوم فقط
            if (a.date && new Date(a.date).toISOString().slice(0, 10) === today && a.personId?._id) {
              map[a.personId._id] = a.status;
            }
          });
        }
        setAttendanceMap(map);
      } catch {
        setStudents([]);
        setAttendanceMap({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // عند الضغط على زر الحضور/الغياب
  const onMarkAttendance = async (studentId: string, status: string) => {
    setSubmitting(studentId);
    try {
      await apiService.createAttendance({
        personId: studentId,
        personType: 'student',
        date: new Date().toISOString().split('T')[0],
        status,
        parentId: (user as any)?._id || (user as any)?.id,
      });
      setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
      if (refreshParentDashboard) refreshParentDashboard();
    } catch {
      // يمكن عرض رسالة خطأ هنا
    } finally {
      setSubmitting(null);
    }
  };

  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={isDark ? '#fff' : '#007bff'} />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {students.length === 0 ? (
        <Text style={styles.emptyText}>لا يوجد طلاب</Text>
      ) : (
        students.map(student => (
          <View key={student._id} style={styles.card}>
            <View style={styles.rowTop}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{student.firstName} {student.lastName}</Text>
                {/* يمكنك هنا عرض بيانات إضافية مثل الصف أو الرقم الأكاديمي إذا كانت متوفرة */}
                {/* <Text style={styles.info}>{student.grade || ''}</Text> */}
              </View>
              <View style={styles.statusBadgeWrap}>
                <Text style={[
                  styles.statusBadge,
                  attendanceMap[student._id] === 'present' && styles.present,
                  attendanceMap[student._id] === 'absent' && styles.absent,
                  !attendanceMap[student._id] && styles.unknown
                ]}>
                  {attendanceMap[student._id] === 'present' ? 'حاضر' : attendanceMap[student._id] === 'absent' ? 'غائب' : 'لم يتم التحديد'}
                </Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.presentBtn, attendanceMap[student._id] === 'present' && styles.selectedBtn]}
                onPress={() => onMarkAttendance(student._id, 'present')}
                activeOpacity={0.7}
                disabled={submitting === student._id}
              >
                <Text style={styles.btnText}>{submitting === student._id ? '...' : 'حاضر'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.absentBtn, attendanceMap[student._id] === 'absent' && styles.selectedBtn]}
                onPress={() => onMarkAttendance(student._id, 'absent')}
                activeOpacity={0.7}
                disabled={submitting === student._id}
              >
                <Text style={styles.btnText}>{submitting === student._id ? '...' : 'غائب'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: isDark ? '#181a20' : '#f7f7fa',
      minHeight: '100%',
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: isDark ? '#181a20' : '#f7f7fa',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: isDark ? '#aaa' : '#888',
      fontSize: 18,
    },
    card: {
      backgroundColor: isDark ? '#23262f' : '#fff',
      borderRadius: 16,
      padding: 18,
      marginBottom: 18,
      shadowColor: isDark ? '#000' : '#aaa',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 14,
      backgroundColor: isDark ? '#2d2f36' : '#e0e0e0',
    },
    name: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#222',
    },
    info: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      marginTop: 2,
    },
    statusBadgeWrap: {
      marginLeft: 8,
    },
    statusBadge: {
      fontSize: 13,
      fontWeight: 'bold',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#eee',
      color: '#555',
      textAlign: 'center',
    },
    present: {
      backgroundColor: '#d1f7c4',
      color: '#1a7f37',
    },
    absent: {
      backgroundColor: '#ffd6d6',
      color: '#c00',
    },
    unknown: {
      backgroundColor: isDark ? '#444' : '#eee',
      color: isDark ? '#bbb' : '#888',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      marginHorizontal: 4,
      backgroundColor: isDark ? '#353945' : '#f0f0f0',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    presentBtn: {
      backgroundColor: '#e8fbe8',
    },
    absentBtn: {
      backgroundColor: '#ffeaea',
    },
    selectedBtn: {
      borderColor: '#007bff',
      borderWidth: 1.5,
    },
    btnText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#222',
    },
  });
} 