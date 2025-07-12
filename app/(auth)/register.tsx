import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Button  } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';
import { AnimatedBus } from '../../components/AnimatedBus';
import { Colors } from '../../constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const [role, setRole] = useState('parent');
  const [image, setImage] = useState<any>(null);
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const picked = result.assets[0];
      setImage({
        uri: picked.uri,
        name: picked.fileName || 'profile.jpg',
        type: picked.type || 'image/jpeg',
      });
    }
  };

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword || (role === 'driver' && (!licenseNumber || !phone))) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Split name into firstName and lastName
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || '';

    setIsLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        image,
        ...(role === 'driver' && { licenseNumber }),
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error?.message || JSON.stringify(error) || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <AnimatedBus size={60} />
          <Text style={styles.title}>Join BusTrack</Text>
          <Text style={styles.subtitle}>Create your account to get started.</Text>
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter your full name"
            required
          />

          <CustomInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Text style={{ marginTop: 10, marginBottom: 4 }}>Role</Text>
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={{ marginBottom: 16 }}
          >
            <Picker.Item label="Parent" value="parent" />
            <Picker.Item label="Driver" value="driver" />
            <Picker.Item label="Admin" value="admin" />
            <Picker.Item label="Manager" value="manager" />
          </Picker>

          {role === 'driver' && (
            <>
              <CustomInput
                label="License Number"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Enter your license number"
                required
              />
              <CustomInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                required
              />
            </>
          )}

          <CustomInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="Enter your password"
            secureTextEntry
            required
          />

          <CustomInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry
            required
          />

          <Button title={image ? "Change Image" : "Pick Image"} onPress={pickImage} />
          {image && (
            <Image
              source={{ uri: image.uri }}
              style={{ width: 100, height: 100, marginVertical: 8, alignSelf: 'center', borderRadius: 50 }}
            />
          )}

          <CustomButton
            title={isLoading ? "Creating Account..." : "Create Account"}
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <CustomButton
              title="Sign In"
              onPress={navigateToLogin}
              variant="outline"
              size="small"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
});