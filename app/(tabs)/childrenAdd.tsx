import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiService } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function AddChildScreen() {
  const router = useRouter();
  const [newChild, setNewChild] = useState({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '' });
  const [saving, setSaving] = useState(false);

  const isFormValid = newChild.firstName && newChild.lastName && newChild.email && newChild.password && newChild.grade && newChild.school;

  const handleAddChild = async () => {
    if (!isFormValid) return;
    setSaving(true);
    try {
      await apiService.addChild(newChild);
      Alert.alert('Success', 'Child added successfully');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to add child');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.brandMediumBlue} />
        </TouchableOpacity>
        <Text style={styles.header}>Add New Child</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          placeholder="First Name *"
          value={newChild.firstName}
          onChangeText={v => setNewChild(prev => ({ ...prev, firstName: v }))}
          style={[styles.input, !newChild.firstName && styles.inputError]}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Last Name *"
          value={newChild.lastName}
          onChangeText={v => setNewChild(prev => ({ ...prev, lastName: v }))}
          style={[styles.input, !newChild.lastName && styles.inputError]}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Email *"
          value={newChild.email}
          onChangeText={v => setNewChild(prev => ({ ...prev, email: v }))}
          style={[styles.input, !newChild.email && styles.inputError]}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Password *"
          value={newChild.password}
          onChangeText={v => setNewChild(prev => ({ ...prev, password: v }))}
          style={[styles.input, !newChild.password && styles.inputError]}
          secureTextEntry
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Grade *"
          value={newChild.grade}
          onChangeText={v => setNewChild(prev => ({ ...prev, grade: v }))}
          style={[styles.input, !newChild.grade && styles.inputError]}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="School *"
          value={newChild.school}
          onChangeText={v => setNewChild(prev => ({ ...prev, school: v }))}
          style={[styles.input, !newChild.school && styles.inputError]}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          onPress={async () => {
            if (!isFormValid) return;
            Keyboard.dismiss();
            await handleAddChild();
          }}
          disabled={saving || !isFormValid}
          style={[styles.saveBtn, (!isFormValid || saving) && { opacity: 0.6 }]}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { marginRight: 12, padding: 4 },
  header: { fontSize: 22, fontWeight: 'bold', color: Colors.brandMediumBlue },
  form: { marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 10, fontSize: 16 },
  inputError: { borderColor: Colors.error },
  saveBtn: { backgroundColor: Colors.brandMediumBlue, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
}); 