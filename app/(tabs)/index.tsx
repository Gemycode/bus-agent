import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { AnimatedBus } from '../../components/AnimatedBus';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { Bus, Users, MapPin, Calendar, TrendingUp } from 'lucide-react-native';

interface DashboardStats {
  totalBuses?: number;
  activeBuses?: number;
  totalStudents?: number;
  presentToday?: number;
  totalRoutes?: number;
  onTimePercentage?: number;
  totalParents?: number;
  absencesToday?: number;
  attendanceRate?: number;
  totalChildren?: number;
  totalDrivers?: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState({
    name: '',
    start_point: '',
    end_point: '',
    estimated_time: '',
    stops: [''],
  });
  const [savingRoute, setSavingRoute] = useState(false);
  const [buses, setBuses] = useState<any[]>([]);
  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);
  const [newBus, setNewBus] = useState({ BusNumber: '', capacity: '', status: 'active', assigned_driver_id: '', route_id: '' });
  const [addingBus, setAddingBus] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [newRoute, setNewRoute] = useState({
    name: '',
    start_point: { name: '', lat: '', long: '' },
    end_point: { name: '', lat: '', long: '' },
    estimated_time: '',
    stops: [{ name: '', lat: '', long: '' }],
  });
  const [addingRoute, setAddingRoute] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (user?.role === 'admin' || user?.role === 'manager') {
        const [busesRaw, attendanceStatsRaw, usersRaw, attendancesRaw] = await Promise.all([
          apiService.getAllBuses(),
          apiService.getAttendanceStats(),
          apiService.getAllUsers ? apiService.getAllUsers() : [],
          apiService.getAttendances ? apiService.getAttendances() : [],
        ]);
        console.log('Buses:', busesRaw);
        console.log('Routes:', await apiService.getAllRoutes());
        console.log('Users:', usersRaw);
        setBuses(busesRaw as any[]);
        const buses = busesRaw as any[];
        const users = usersRaw as any[];
        const attendances = attendancesRaw as any[];
        const attendanceStats = attendanceStatsRaw as any;
        const today = new Date().toISOString().slice(0, 10);
        const students = users.filter((u: any) => u.role === 'student');
        const parents = users.filter((u: any) => u.role === 'parent');
        const absencesToday = attendances.filter((a: any) => a.date && a.date.startsWith(today) && a.status === 'absent');
        const drivers = users.filter((u: any) => u.role === 'driver');
        const routesList = await apiService.getAllRoutes();
        setStats({
          totalBuses: Number(buses.length),
          activeBuses: Number(buses.filter((bus: any) => bus.status === 'active').length),
          totalStudents: Number(students.length),
          totalParents: Number(parents.length),
          absencesToday: Number(absencesToday.length),
          totalDrivers: drivers.length,
          totalRoutes: Array.isArray(routesList) ? routesList.length : 0,
          ...((attendanceStats as Record<string, any>) || {}),
        } as DashboardStats);
      } else if (user?.role === 'parent') {
        try {
          const [attendanceStats, childrenData] = await Promise.all([
            apiService.getParentAttendances(),
            apiService.getMyChildren()
          ]);
          
          // Calculate attendance stats for parent's children
          const children = Array.isArray(childrenData) ? childrenData : 
                          ((childrenData as any)?.children ? (childrenData as any).children : []);
          
          const today = new Date().toISOString().slice(0, 10);
          const todayAttendances = Array.isArray(attendanceStats) ? 
            attendanceStats.filter((a: any) => a.date && a.date.startsWith(today)) : [];
          
          const presentToday = todayAttendances.filter((a: any) => a.status === 'present').length;
          const absentToday = todayAttendances.filter((a: any) => a.status === 'absent').length;
          const totalToday = presentToday + absentToday;
          const attendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
          
          setStats({
            presentToday,
            absencesToday: absentToday,
            attendanceRate,
            totalChildren: children.length
          } as DashboardStats);
        } catch (error) {
          console.error('Failed to load parent stats:', error);
          setStats({
            presentToday: 0,
            absencesToday: 0,
            attendanceRate: 0,
            totalChildren: user?.children?.length || 0
          } as DashboardStats);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleAddRouteStop = () => {
    setNewRoute(prev => ({ ...prev, stops: [...prev.stops, { name: '', lat: '', long: '' }] }));
  };
  const handleRemoveRouteStop = (idx: number) => {
    setNewRoute(prev => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }));
  };
  const handleStopChange = (idx: number, value: string) => {
    setRouteForm(prev => ({ ...prev, stops: prev.stops.map((s, i) => (i === idx ? value : s)) }));
  };
  const handleRouteInputChange = (field: string, value: string) => {
    setRouteForm(prev => ({ ...prev, [field]: value }));
  };
  const handleSaveRoute = async () => {
    if (!routeForm.name || !routeForm.start_point || !routeForm.end_point || !routeForm.estimated_time || routeForm.stops.some(s => !s)) {
      alert('Please fill all fields and stops');
      return;
    }
    setSavingRoute(true);
    try {
      await apiService.createRoute({
        name: routeForm.name,
        start_point: routeForm.start_point,
        end_point: routeForm.end_point,
        estimated_time: routeForm.estimated_time,
        stops: routeForm.stops,
      });
      setShowRouteModal(false);
      setRouteForm({ name: '', start_point: '', end_point: '', estimated_time: '', stops: [''] });
      loadDashboardData();
    } catch (e) {
      alert('Failed to add route');
    } finally {
      setSavingRoute(false);
    }
  };

  const openAddBusModal = async () => {
    setEditingBus(null);
    setNewBus({ BusNumber: '', capacity: '', status: 'active', assigned_driver_id: '', route_id: '' });
    setShowBusModal(true);
    // Fetch drivers and routes for dropdowns
    try {
      const [driversList, routesList] = await Promise.all([
        apiService.getAllDrivers(),
        apiService.getAllRoutes(),
      ]);
      setDrivers(Array.isArray(driversList) ? driversList : []);
      setRoutes(Array.isArray(routesList) ? routesList : []);
    } catch {}
  };

  const openEditBusModal = async (bus: any) => {
    setEditingBus(bus);
    setNewBus({
      BusNumber: bus.BusNumber || '',
      capacity: bus.capacity ? String(bus.capacity) : '',
      status: bus.status || 'active',
      assigned_driver_id: bus.assigned_driver_id || '',
      route_id: bus.route_id || '',
    });
    setShowBusModal(true);
    // Fetch drivers and routes for dropdowns
    try {
      const [driversList, routesList] = await Promise.all([
        apiService.getAllDrivers(),
        apiService.getAllRoutes(),
      ]);
      setDrivers(Array.isArray(driversList) ? driversList : []);
      setRoutes(Array.isArray(routesList) ? routesList : []);
    } catch {}
  };

  const handleAddOrEditBus = async () => {
    if (!newBus.BusNumber || !newBus.capacity) {
      alert('Please enter bus number and capacity');
      return;
    }
    setAddingBus(true);
    try {
      if (editingBus) {
        await apiService.updateBus(editingBus._id || editingBus.id, {
          ...newBus,
          capacity: Number(newBus.capacity),
          assigned_driver_id: newBus.assigned_driver_id || null,
          route_id: newBus.route_id || null,
        });
      } else {
        await apiService.createBus({
          ...newBus,
          capacity: Number(newBus.capacity),
          assigned_driver_id: newBus.assigned_driver_id || null,
          route_id: newBus.route_id || null,
        });
      }
      setShowBusModal(false);
      setNewBus({ BusNumber: '', capacity: '', status: 'active', assigned_driver_id: '', route_id: '' });
      setEditingBus(null);
      loadDashboardData();
    } catch (e) {
      alert('Failed to save bus');
    } finally {
      setAddingBus(false);
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    try {
      await apiService.deleteBus(busId);
      loadDashboardData();
    } catch (e) {
      alert('Failed to delete bus');
    }
  };

  const loadRoutes = async () => {
    try {
      const routesList = await apiService.getAllRoutes();
      setRoutes(Array.isArray(routesList) ? routesList : []);
    } catch {}
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadRoutes();
    }
  }, [user]);

  const openAddRouteModal = () => {
    setEditingRoute(null);
    setNewRoute({
      name: '',
      start_point: { name: '', lat: '', long: '' },
      end_point: { name: '', lat: '', long: '' },
      estimated_time: '',
      stops: [{ name: '', lat: '', long: '' }],
    });
    setShowRouteModal(true);
  };

  const openEditRouteModal = (route: any) => {
    setEditingRoute(route);
    setNewRoute({
      name: route.name || '',
      start_point: {
        name: route.start_point?.name || '',
        lat: route.start_point?.lat ? String(route.start_point.lat) : '',
        long: route.start_point?.long ? String(route.start_point.long) : '',
      },
      end_point: {
        name: route.end_point?.name || '',
        lat: route.end_point?.lat ? String(route.end_point.lat) : '',
        long: route.end_point?.long ? String(route.end_point.long) : '',
      },
      estimated_time: route.estimated_time || '',
      stops: Array.isArray(route.stops) && route.stops.length > 0 ? route.stops.map((s: any) => ({
        name: s.name || '',
        lat: s.lat ? String(s.lat) : '',
        long: s.long ? String(s.long) : '',
      })) : [{ name: '', lat: '', long: '' }],
    });
    setShowRouteModal(true);
  };

  const handleAddOrEditRoute = async () => {
    if (!newRoute.name || !newRoute.start_point.name || !newRoute.end_point.name || !newRoute.estimated_time) {
      alert('Please fill all required fields');
      return;
    }
    setAddingRoute(true);
    try {
      const routePayload = {
        ...newRoute,
        start_point: {
          ...newRoute.start_point,
          lat: Number(newRoute.start_point.lat),
          long: Number(newRoute.start_point.long),
        },
        end_point: {
          ...newRoute.end_point,
          lat: Number(newRoute.end_point.lat),
          long: Number(newRoute.end_point.long),
        },
        stops: newRoute.stops.map(s => ({
          ...s,
          lat: Number(s.lat),
          long: Number(s.long),
        })),
      };
      if (editingRoute) {
        await apiService.updateRoute(editingRoute._id || editingRoute.id, routePayload);
      } else {
        await apiService.createRoute(routePayload);
      }
      setShowRouteModal(false);
      setEditingRoute(null);
      loadRoutes();
    } catch (e) {
      alert('Failed to save route');
    } finally {
      setAddingRoute(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await apiService.deleteRoute(routeId);
      loadRoutes();
    } catch (e) {
      alert('Failed to delete route');
    }
  };

  const renderWelcomeCard = () => (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeTitle}>Welcome back, {user?.name}!</Text>
        <Text style={styles.welcomeSubtitle}>
          {user?.role === 'admin' && 'Manage your bus fleet and monitor operations'}
          {user?.role === 'manager' && 'Oversee daily operations and track performance'}
          {user?.role === 'driver' && 'Check your route and manage attendance'}
          {user?.role === 'parent' && 'Track your children and view attendance'}
        </Text>
      </View>
      <AnimatedBus size={50} />
    </View>
  );

  const renderStatsCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsIcon}>
        {icon}
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderParentStats = () => (
    <View style={styles.statsGrid}>
      {renderStatsCard(
        'My Children',
        stats.totalChildren || user?.children?.length || 0,
        <Users size={24} color={Colors.brandMediumBlue} />,
        Colors.brandMediumBlue
      )}
      {renderStatsCard(
        'Present Today',
        stats.presentToday || 0,
        <Calendar size={24} color={Colors.success} />,
        Colors.success
      )}
      {renderStatsCard(
        'Absent Today',
        stats.absencesToday || 0,
        <Calendar size={24} color={Colors.error} />,
        Colors.error
      )}
      {renderStatsCard(
        'Attendance Rate',
        stats.attendanceRate ? `${stats.attendanceRate}%` : '0%',
        <TrendingUp size={24} color={Colors.brandAccent} />,
        Colors.brandAccent
      )}
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // دمج كل محتوى الإحصائيات والبطاقات في ListHeaderComponent
  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>
      {renderWelcomeCard()}
      {/* Overview Section for Admin */}
      {user?.role === 'admin' && (
        <View style={{ marginBottom: 24 }}>
          {/* Maintenance Alert */}
          {buses.some((b: any) => b.status === 'Maintenance') && (
            <View style={{ backgroundColor: Colors.warning, padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Warning: Some buses are under maintenance!</Text>
            </View>
          )}
          {/* Stat Cards */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.brandMediumBlue }}>{stats.totalRoutes || 0}</Text>
              <Text style={{ color: Colors.gray600 }}>Routes</Text>
            </View>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.brandDarkBlue }}>{stats.totalBuses || 0}</Text>
              <Text style={{ color: Colors.gray600 }}>Buses</Text>
            </View>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.brandAccent }}>{stats.totalStudents || 0}</Text>
              <Text style={{ color: Colors.gray600 }}>Students</Text>
            </View>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.info }}>{stats.totalDrivers || 0}</Text>
              <Text style={{ color: Colors.gray600 }}>Drivers</Text>
            </View>
          </View>
          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity onPress={openAddBusModal} style={{ backgroundColor: Colors.brandMediumBlue, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Add Bus</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openAddRouteModal} style={{ backgroundColor: Colors.brandAccent, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Add Route</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: Colors.info, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: Colors.success, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Link Bus to Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Quick Actions Section (غير مرتبطة بالقائمة) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {user?.role === 'admin' && (
            <>
              <View style={styles.actionCard}>
                <MapPin size={24} color={Colors.brandMediumBlue} />
                <Text style={styles.actionTitle}>Manage Routes</Text>
              </View>
              <View style={styles.actionCard}>
                <Bus size={24} color={Colors.brandMediumBlue} />
                <Text style={styles.actionTitle}>Fleet Status</Text>
              </View>
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle} onPress={() => setShowRouteModal(true)}>+ Add Route</Text>
              </View>
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>+ Add Bus</Text>
              </View>
              <View style={styles.actionCard}>
                <Text style={styles.actionTitle}>+ Link Route to Bus</Text>
              </View>
            </>
          )}
          {user?.role === 'parent' && (
            <>
              <View style={styles.actionCard}>
                <MapPin size={24} color={Colors.brandMediumBlue} />
                <Text style={styles.actionTitle}>Track Bus</Text>
              </View>
              <View style={styles.actionCard}>
                <Calendar size={24} color={Colors.brandMediumBlue} />
                <Text style={styles.actionTitle}>View Attendance</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </>
  );

  // عرض الباصات في FlatList واحدة فقط
  return (
    <FlatList
      data={user?.role === 'admin' ? buses : []}
      keyExtractor={(item) => item._id || item.id || item.BusNumber}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8 }}>
          <Text style={{ flex: 1, fontWeight: 'bold' }}>Bus #{item.BusNumber}</Text>
          <Text style={{ flex: 1 }}>Capacity: {item.capacity}</Text>
          <Text style={{ flex: 1 }}>Status: {item.status}</Text>
          <TouchableOpacity style={{ marginHorizontal: 4, padding: 4, backgroundColor: Colors.brandAccent, borderRadius: 4 }} onPress={() => openEditBusModal(item)}>
            <Text style={{ color: '#fff' }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginHorizontal: 4, padding: 4, backgroundColor: Colors.error, borderRadius: 4 }} onPress={() => handleDeleteBus(item._id || item.id)}>
            <Text style={{ color: '#fff' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<Text style={{ textAlign: 'center', color: Colors.gray400 }}>No buses found.</Text>}
      style={{ marginVertical: 8, backgroundColor: Colors.gray50 }}
    />
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
  headerDate: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
  welcomeCard: {
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
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brandDarkBlue,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
    lineHeight: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: Colors.white,
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIcon: {
    marginRight: 12,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
  },
  statsTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.gray600,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: Colors.white,
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.brandDarkBlue,
    marginTop: 8,
    textAlign: 'center',
  },
});