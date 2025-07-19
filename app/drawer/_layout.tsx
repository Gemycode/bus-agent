import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="adminTrips" options={{ drawerLabel: 'إدارة الرحلات' }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: 'الملف الشخصي' }} />
      <Drawer.Screen name="attendance" options={{ drawerLabel: 'الحضور' }} />
      <Drawer.Screen name="children" options={{ drawerLabel: 'الأبناء' }} />
      <Drawer.Screen name="adminAssignments" options={{ drawerLabel: 'تعيينات اليوم' }} />
      <Drawer.Screen name="notifications" options={{ drawerLabel: 'الإشعارات' }} />
      {/* أضف باقي الشاشات هنا إذا أردت */}
    </Drawer>
  );
} 