import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

type Student = {
  _id: string;
  firstName: string;
  lastName: string;
  attendanceStatus?: string;
};

type Props = {
  students: Student[];
  onMarkAttendance: (studentId: string, status: string) => void;
  loading: boolean;
};

export default function StudentAttendanceList({ students, onMarkAttendance, loading }: Props) {
  if (loading) return <ActivityIndicator />;
  return (
    <View>
      {students.map(student => (
        <View key={student._id} style={{ marginBottom: 12 }}>
          <Text>{student.firstName} {student.lastName}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => onMarkAttendance(student._id, 'present')} style={{ marginRight: 8, backgroundColor: student.attendanceStatus === 'present' ? '#d1f7c4' : '#eee', padding: 8, borderRadius: 6 }}>
              <Text>حاضر</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onMarkAttendance(student._id, 'absent')} style={{ backgroundColor: student.attendanceStatus === 'absent' ? '#ffd6d6' : '#eee', padding: 8, borderRadius: 6 }}>
              <Text>غائب</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
} 