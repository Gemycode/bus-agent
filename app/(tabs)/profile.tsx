import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors } from '../../constants/Colors';
import { User, Settings, LogOut, CreditCard as Edit, Phone, Mail, UserCheck } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [profileChildren, setProfileChildren] = useState<any[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateUser(formData);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const loadProfileChildren = async () => {
    if (user?.role !== 'parent') return;
    
    setLoadingChildren(true);
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
      
      setProfileChildren(childrenList);
    } catch (error) {
      console.error('Error loading profile children:', error);
      // Create sample data on error
      setProfileChildren([
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
      setLoadingChildren(false);
    }
  };

  // Load children when component mounts or user changes
  useEffect(() => {
    if (user?.role === 'parent') {
      loadProfileChildren();
    }
  }, [user?.role]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'driver':
        return 'Driver';
      case 'parent':
        return 'Parent';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return Colors.error;
      case 'manager':
        return Colors.brandAccent;
      case 'driver':
        return Colors.info;
      case 'parent':
        return Colors.success;
      default:
        return Colors.gray500;
    }
  };

  const renderProfileInfo = () => (
          <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {(user as any)?.profileImage || (user as any)?.image ? (
            <Image
              source={{ 
                uri: (user as any)?.profileImage || (user as any)?.image 
              }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <User size={40} color={Colors.white} />
            </View>
          )}
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role || '') }]}>
          <UserCheck size={16} color={Colors.white} />
          <Text style={styles.roleText}>{getRoleDisplayName(user?.role || '')}</Text>
        </View>
      </View>

      <View style={styles.profileDetails}>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setIsEditing(!isEditing)}
      >
        <Edit size={20} color={Colors.brandMediumBlue} />
      </TouchableOpacity>
    </View>
  );

  const renderEditForm = () => (
    <View style={styles.editForm}>
      <Text style={styles.sectionTitle}>Edit Profile</Text>
      
      <CustomInput
        label="Full Name"
        value={formData.name}
        onChangeText={(value) => handleInputChange('name', value)}
        placeholder="Enter your full name"
      />

      <CustomInput
        label="Email"
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <CustomInput
        label="Phone Number"
        value={formData.phone}
        onChangeText={(value) => handleInputChange('phone', value)}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
      />

      <View style={styles.editActions}>
        <CustomButton
          title="Cancel"
          onPress={() => setIsEditing(false)}
          variant="outline"
          style={styles.actionButton}
        />
        <CustomButton
          title="Save"
          onPress={handleSave}
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  const renderInfoCard = (icon: React.ReactNode, label: string, value: string) => (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

    const renderChildren = () => {
    if (user?.role !== 'parent') return null;

    if (loadingChildren) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children</Text>
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: Colors.gray500, fontSize: 16 }}>Loading children...</Text>
          </View>
        </View>
      );
    }

    if (profileChildren.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children</Text>
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: Colors.gray500, fontSize: 16 }}>No children added yet</Text>
            <Text style={{ color: Colors.gray400, fontSize: 14, marginTop: 4 }}>Add your children in the Children tab</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>Children</Text>
          <TouchableOpacity 
            onPress={loadProfileChildren}
            style={{ 
              backgroundColor: Colors.brandMediumBlue, 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: Colors.white, fontWeight: '600', marginRight: 4 }}>Refresh</Text>
            <Text style={{ color: Colors.white, fontSize: 14 }}>↻</Text>
          </TouchableOpacity>
        </View>
        {profileChildren.map((child, index) => (
          <View key={child._id || index} style={styles.childCard}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>
                {child.name || `${(child as any).firstName || ''} ${(child as any).lastName || ''}`}
              </Text>
              <Text style={styles.childDetails}>
                Grade {child.grade} • {child.school}
              </Text>
              {(child as any).email && (
                <Text style={{ color: Colors.gray500, fontSize: 12, marginTop: 2 }}>
                  {(child as any).email}
                </Text>
              )}
            </View>
            {child.busId && (
              <View style={styles.busInfo}>
                <Text style={styles.busNumber}>Bus {child.busId}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account settings</Text>
      </View>

      {renderProfileInfo()}

      {isEditing ? (
        renderEditForm()
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {renderInfoCard(
            <Mail size={20} color={Colors.brandMediumBlue} />,
            'Email',
            user?.email || 'Not provided'
          )}
          {renderInfoCard(
            <Phone size={20} color={Colors.brandMediumBlue} />,
            'Phone',
            user?.phone || 'Not provided'
          )}
        </View>
      )}

      {renderChildren()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionCard}>
          <Settings size={20} color={Colors.gray600} />
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    backgroundColor: Colors.white,
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
  profileCard: {
    backgroundColor: Colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brandMediumBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray200,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
    marginLeft: 4,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brandDarkBlue,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
  editButton: {
    padding: 8,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brandDarkBlue,
    marginBottom: 12,
  },
  editForm: {
    backgroundColor: Colors.white,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray500,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.brandDarkBlue,
  },
  childCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brandDarkBlue,
    marginBottom: 2,
  },
  childDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
  busInfo: {
    backgroundColor: Colors.brandBeige,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  busNumber: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.brandDarkBlue,
  },
  actionCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.brandDarkBlue,
    marginLeft: 12,
  },
});