import React, { useEffect, useState } from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Chrome as Home, MapPin, Users, BookOpen, Bus, Shield, Bell, User, Calendar } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { TouchableOpacity, View, Text } from 'react-native';
import { apiService } from '../../services/api';

const Drawer = createDrawerNavigator();

function getTitleForRoute(routeName: string) {
  switch (routeName) {
    case 'index': return 'Dashboard';
    case 'children': return 'Children';
    case 'booking': return 'Booking';
    case 'driverTrips': return 'My Trips';
    case 'adminAssignments': return 'Assignments';
    default: return '';
  }
}

function CustomDrawerContent(props: any) {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function fetchChildren() {
      if (user?.role === 'parent') {
        try {
          const res: any = await apiService.getMyChildren();
          let childrenList: any[] = [];
          if (res && res.success && res.data && Array.isArray(res.data.children)) {
            childrenList = res.data.children;
          } else if (res && Array.isArray(res.children)) {
            childrenList = res.children;
          } else if (Array.isArray(res)) {
            childrenList = res;
          }
          if (mounted) setChildren(childrenList);
        } catch {
          if (mounted) setChildren([]);
        }
      }
    }
    fetchChildren();
    return () => { mounted = false; };
  }, [user]);

  // إضافة state للتحكم في إظهار شاشة الأبناء
  const goToAddChild = () => {
    // انتقل إلى شاشة الأبناء (children) في الدروير
    props.navigation.navigate('children');
  };

  // عناصر الدروير حسب الدور
  const drawerItems: { name: string; label: string; icon: (color: string, size: number) => React.ReactElement }[] = [];
  if (user && user.role === 'parent') {
    drawerItems.push(
      { name: 'profile', label: 'Profile', icon: (color: string, size: number) => <User color={color} size={size} /> },
      { name: 'attendance', label: 'Attendance', icon: (color: string, size: number) => <Calendar color={color} size={size} /> },
    );
  } else if (user && user.role === 'driver') {
    drawerItems.push(
      { name: 'profile', label: 'Profile', icon: (color: string, size: number) => <User color={color} size={size} /> },
      // يمكن إضافة شاشات أخرى خاصة بالسائق هنا لاحقاً
    );
  } else if (user && (user.role === 'admin')) {
    drawerItems.push(
      { name: 'profile', label: 'Profile', icon: (color: string, size: number) => <User color={color} size={size} /> },
      { name: 'attendance', label: 'Attendance', icon: (color: string, size: number) => <Calendar color={color} size={size} /> },
      { name: 'adminAssignments', label: 'Assignments', icon: (color: string, size: number) => <Shield color={color} size={size} /> },
      { name: 'driverTrips', label: 'Driver Trips', icon: (color: string, size: number) => <Bus color={color} size={size} /> },
      { name: 'StudentAttendanceList', label: 'Student Attendance', icon: (color: string, size: number) => <Users color={color} size={size} /> },
    );
  }
  // إزالة التكرار بناءً على الاسم
  const uniqueDrawerItems = drawerItems.filter((item, index, self) =>
    index === self.findIndex((i) => i.name === item.name)
  );
  return (
    <DrawerContentScrollView {...props}>
      {/* عرض الأبناء لولي الأمر فقط */}
      {user?.role === 'parent' && children.length > 0 && (
        <View style={{ padding: 16, paddingTop: 0, paddingBottom: 0 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: Colors.brandMediumBlue }}>My Children</Text>
          {children.map(child => (
            <View key={child._id || child.id} style={{ backgroundColor: '#f3f6fa', borderRadius: 10, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: Colors.brandDarkBlue }}>{child.firstName} {child.lastName}</Text>
                <Text style={{ color: Colors.gray600, fontSize: 13 }}>Grade: {child.grade || 'N/A'} | School: {child.school || 'N/A'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      <DrawerItemList {...props} />
      {uniqueDrawerItems.map(item => (
        <DrawerItem
          key={item.name}
          label={item.label}
          icon={({ color, size }) => item.icon(color, size)}
          onPress={() => props.navigation.navigate(item.name)}
        />
      ))}
    </DrawerContentScrollView>
  );
}

function TabsNavigator() {
  const { user } = useAuth();
  // تعريف التابات السفلية (4 فقط لكل دور)
  const parentTabs = [
    { name: 'index', title: 'Dashboard', icon: (color: string, size: number) => <Home color={color} size={size} /> },
    { name: 'booking', title: 'Booking', icon: (color: string, size: number) => <BookOpen color={color} size={size} /> },
    { name: 'StudentAttendanceList', title: 'Attendance', icon: (color: string, size: number) => <Users color={color} size={size} /> },
  ];
  const driverTabs = [
    { name: 'index', title: 'Dashboard', icon: (color: string, size: number) => <Home color={color} size={size} /> },
    { name: 'driverTrips', title: 'My Trips', icon: (color: string, size: number) => <Bus color={color} size={size} /> },
  ];
  const adminTabs = [
    { name: 'index', title: 'Dashboard', icon: (color: string, size: number) => <Home color={color} size={size} /> },
    { name: 'adminAssignments', title: 'Assignments', icon: (color: string, size: number) => <Shield color={color} size={size} /> },
  ];
  type TabType = { name: string; title: string; icon: (color: string, size: number) => React.ReactElement };
  let tabsToShow: TabType[] = [];
  if (user && user.role === 'parent') tabsToShow = parentTabs;
  else if (user && user.role === 'driver') tabsToShow = driverTabs;
  else if (user && (user.role === 'admin')) tabsToShow = adminTabs;

  // Custom header title that opens the drawer
  const CustomHeaderTitle = ({ title, navigation }: { title: string; navigation: any }) => (
    <TouchableOpacity onPress={() => navigation.openDrawer()}>
      <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: Colors.brandDarkBlue }}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerTitle: () => <CustomHeaderTitle title={getTitleForRoute(route.name)} navigation={navigation} />,
        tabBarActiveTintColor: Colors.brandMediumBlue,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray200,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ size, color }) => (
            <Bell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function Layout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Drawer.Navigator drawerContent={props => <CustomDrawerContent {...props} />}> 
      <Drawer.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false, drawerLabel: 'Home', drawerIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      {/* باقي الشاشات الثانوية (يتم التنقل لها من الدروير فقط) */}
      <Drawer.Screen name="profile" component={require('../drawer/profile').default} options={{ drawerLabel: 'Profile', drawerIcon: ({ color, size }) => <User color={color} size={size} /> }} />
      <Drawer.Screen name="attendance" component={require('../drawer/attendance').default} options={{ drawerLabel: 'Attendance', drawerIcon: ({ color, size }) => <Calendar color={color} size={size} /> }} />
      <Drawer.Screen name="adminAssignments" component={require('../drawer/adminAssignments').default} options={{ drawerLabel: 'Assignments', drawerIcon: ({ color, size }) => <Shield color={color} size={size} /> }} />
      <Drawer.Screen name="driverTrips" component={require('./driverTrips').default} options={{ drawerLabel: 'Driver Trips', drawerIcon: ({ color, size }) => <Bus color={color} size={size} /> }} />
      <Drawer.Screen name="StudentAttendanceList" component={require('./StudentAttendanceList').default} options={{ drawerLabel: 'Student Attendance', drawerIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      {/* <Drawer.Screen name="notifications" component={require('../drawer/notifications').default} options={{ drawerLabel: 'Notifications', drawerIcon: ({ color, size }) => <Bell color={color} size={size} /> }} /> */}
      {/* <Drawer.Screen name="driverTripDetails" component={require('../drawer/driverTripDetails').default} options={{ drawerLabel: 'Trip Details', drawerIcon: ({ color, size }) => <Bus color={color} size={size} /> }} /> */}
    </Drawer.Navigator>
  );
}