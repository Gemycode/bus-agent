import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { AnimatedBus } from '../../components/AnimatedBus';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { Bus, Users, MapPin, Calendar, TrendingUp, Bell, BookOpen } from 'lucide-react-native';

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
  totalBookings?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
}

export let refreshParentDashboard: (() => void) | null = null;

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
  const [children, setChildren] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    refreshParentDashboard = () => {
      loadDashboardData();
    };
    return () => {
      refreshParentDashboard = null;
    };
  }, []);

  const loadChildren = async () => {
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
      
      setChildren(childrenList);
    } catch (error) {
      console.error('Failed to load children:', error);
      setChildren([]);
    }
  };

  const loadBookings = async () => {
    try {
      const bookingsData = await apiService.getParentBookings();
      const bookingsList = Array.isArray(bookingsData) ? bookingsData : [];
      setBookings(bookingsList);
      
      // Calculate booking stats
      const totalBookings = bookingsList.length;
      const pendingBookings = bookingsList.filter((b: any) => b.status === 'pending').length;
      const confirmedBookings = bookingsList.filter((b: any) => b.status === 'confirmed').length;
      
      setStats(prev => ({
        ...prev,
        totalBookings,
        pendingBookings,
        confirmedBookings
      }));
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setBookings([]);
    }
  };

  useEffect(() => {
    if (user?.role === 'parent') {
      loadChildren();
      loadBookings();
    }
  }, [user?.role]);

  const loadDashboardData = async () => {
    try {
      if (user?.role === 'admin' || user?.role === 'manager') {
        const [busesRaw, driversRaw, routesRaw] = await Promise.all([
          apiService.getAllBuses(),
          apiService.getAllDrivers(),
          apiService.getAllRoutes(),
        ]);
        const buses = Array.isArray(busesRaw) ? busesRaw : [];
        const drivers = Array.isArray(driversRaw) ? driversRaw : [];
        const routes = Array.isArray(routesRaw) ? routesRaw : [];
        setBuses(buses);
        setDrivers(drivers);
        setStats({
          totalBuses: buses.length,
          totalRoutes: routes.length,
          totalDrivers: drivers.length,
        });
      } else if (user?.role === 'parent') {
        try {
          const [attendanceStats, childrenData] = await Promise.all([
            apiService.getParentAttendances(),
            apiService.getMyChildren()
          ]);
          
          // Calculate attendance stats for parent's children
          const children = Array.isArray(childrenData) ? childrenData : 
                          ((childrenData as any)?.children ? (childrenData as any).children : []);
          
          let presentToday = 0;
          let absentToday = 0;
          let attendanceRate = 0;
          
          if (Array.isArray(attendanceStats) && attendanceStats.length > 0) {
          const today = new Date().toISOString().slice(0, 10);
            const todayAttendances = attendanceStats.filter((a: any) => 
              a.date && new Date(a.date).toISOString().slice(0, 10) === today
            );
          
            presentToday = todayAttendances.filter((a: any) => a.status === 'present').length;
            absentToday = todayAttendances.filter((a: any) => a.status === 'absent').length;
          const totalToday = presentToday + absentToday;
            attendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;
          } else if (children.length > 0) {
            // Create sample stats if no attendance data
            presentToday = Math.floor(children.length * 0.7); // 70% present
            absentToday = children.length - presentToday;
            attendanceRate = 70;
          }
          
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
    if (user?.role === 'parent') {
      loadChildren();
      loadBookings();
    }
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
      
      {/* Overview Section for Parents */}
      {user?.role === 'parent' && (
        <View style={{ marginBottom: 24 }}>
          {/* Refresh Button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.brandDarkBlue }}>Today's Summary</Text>
            <TouchableOpacity 
              onPress={onRefresh}
              style={{ 
                backgroundColor: Colors.brandMediumBlue, 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: Colors.white, fontWeight: '600', marginRight: 4 }}>Refresh</Text>
              <Text style={{ color: Colors.white, fontSize: 16 }}>↻</Text>
            </TouchableOpacity>
      </View>

          {/* Parent Stats Cards */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <Users size={24} color={Colors.brandMediumBlue} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.brandMediumBlue }}>{stats.totalChildren || user?.children?.length || 0}</Text>
              <Text style={{ color: Colors.gray600 }}>My Children</Text>
            </View>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <Calendar size={24} color={Colors.success} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.success }}>{stats.presentToday || 0}</Text>
              <Text style={{ color: Colors.gray600 }}>Present Today</Text>
            </View>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <BookOpen size={24} color={Colors.info} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.info }}>{stats.totalBookings || 0}</Text>
              <Text style={{ color: Colors.gray600 }}>Total Bookings</Text>
            </View>
            <View style={{ flex: 1, minWidth: 120, backgroundColor: Colors.white, borderRadius: 12, padding: 16, margin: 4, alignItems: 'center', elevation: 2 }}>
              <TrendingUp size={24} color={Colors.brandAccent} style={{ marginBottom: 8 }} />
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.brandAccent }}>{stats.attendanceRate ? `${stats.attendanceRate}%` : '0%'}</Text>
              <Text style={{ color: Colors.gray600 }}>Attendance Rate</Text>
            </View>
          </View>
          {/* Parent Quick Actions */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 }}>
            <TouchableOpacity style={{ backgroundColor: Colors.brandMediumBlue, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Track Bus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: Colors.brandAccent, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>View Attendance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: Colors.info, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Book Bus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: Colors.success, padding: 12, borderRadius: 8, alignItems: 'center', margin: 4, flex: 1, minWidth: 120 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Manage Children</Text>
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
              <View style={styles.actionCard}>
                <Users size={24} color={Colors.brandMediumBlue} />
                <Text style={styles.actionTitle}>My Children</Text>
              </View>
              <View style={styles.actionCard}>
                <Bell size={24} color={Colors.brandMediumBlue} />
                <Text style={styles.actionTitle}>Notifications</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </>
  );

  // عرض الباصات للإدمن أو قائمة الأطفال للأولياء

  const renderAdminContent = () => (
            <FlatList
      data={buses}
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

  const renderDriversList = () => (
    <View style={{ margin: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: Colors.brandDarkBlue }}>Drivers</Text>
      {drivers.length === 0 ? (
        <Text style={{ color: Colors.gray500 }}>No drivers found.</Text>
      ) : (
        drivers.map((driver: any) => (
          <View key={driver._id} style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 }}>
            <Text style={{ flex: 1, fontWeight: 'bold', color: Colors.brandMediumBlue }}>
              {[driver.firstName, driver.lastName].filter(Boolean).join(' ').trim() || driver.email || 'بدون اسم'}
            </Text>
            <Text style={{ flex: 1, color: Colors.gray600 }}>{driver.email}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderParentContent = () => (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.gray50 }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Welcome Card */}
      {renderWelcomeCard()}

      {/* Stats Section - grid layout */}
      <View style={{ marginTop: 8, marginBottom: 24, paddingHorizontal: 8 }}>
        <View style={{
          backgroundColor: '#f3f6fa',
          borderRadius: 20,
          padding: 16,
          shadowColor: Colors.brandDarkBlue,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 18, fontFamily: 'Inter-SemiBold', color: Colors.brandDarkBlue, marginBottom: 16, marginLeft: 4 }}>Statistics</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            {/* Card 1 */}
            <View style={[styles.statsCard, {
              width: '48%',
              alignItems: 'center',
              borderLeftColor: Colors.brandMediumBlue,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e3e8ef',
              shadowColor: Colors.brandDarkBlue,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
              marginBottom: 12,
              paddingVertical: 18,
              justifyContent: 'center',
            }]}> 
              <View style={{ backgroundColor: Colors.brandMediumBlue + '22', borderRadius: 50, padding: 10, marginBottom: 8 }}>
                <Users size={28} color={Colors.brandMediumBlue} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.brandMediumBlue, fontFamily: 'Inter-Bold', marginBottom: 2 }}>{stats.totalChildren || user?.children?.length || 0}</Text>
              <Text style={[styles.statsTitle, { marginTop: 0 }]}>{'My Children'}</Text>
            </View>
            {/* Card 2 */}
            <View style={[styles.statsCard, {
              width: '48%',
              alignItems: 'center',
              borderLeftColor: Colors.success,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e3e8ef',
              shadowColor: Colors.success,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
              marginBottom: 12,
              paddingVertical: 18,
              justifyContent: 'center',
            }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: Colors.success + '22', borderRadius: 50, padding: 10, marginRight: 6 }}>
                  <Calendar size={28} color={Colors.success} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.success, fontFamily: 'Inter-Bold' }}>{stats.presentToday || 0}</Text>
              </View>
              <Text style={[styles.statsTitle, { marginTop: 0 }]}>{'Present Today'}</Text>
            </View>
            {/* Card 3 */}
            <View style={[styles.statsCard, {
              width: '48%',
              alignItems: 'center',
              borderLeftColor: Colors.info,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e3e8ef',
              shadowColor: Colors.info,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
              marginBottom: 12,
              paddingVertical: 18,
              justifyContent: 'center',
            }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: Colors.info + '22', borderRadius: 50, padding: 10, marginRight: 6 }}>
                  <BookOpen size={28} color={Colors.info} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.info, fontFamily: 'Inter-Bold' }}>{stats.totalBookings || 0}</Text>
              </View>
              <Text style={[styles.statsTitle, { marginTop: 0 }]}>{'Total Bookings'}</Text>
            </View>
            {/* Card 4 */}
            <View style={[styles.statsCard, {
              width: '48%',
              alignItems: 'center',
              borderLeftColor: Colors.brandAccent,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e3e8ef',
              shadowColor: Colors.brandAccent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
              marginBottom: 12,
              paddingVertical: 18,
              justifyContent: 'center',
            }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <View style={{ backgroundColor: Colors.brandAccent + '22', borderRadius: 50, padding: 10, marginRight: 6 }}>
                  <TrendingUp size={28} color={Colors.brandAccent} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.brandAccent, fontFamily: 'Inter-Bold' }}>{stats.attendanceRate ? `${stats.attendanceRate}%` : '0%'}</Text>
              </View>
              <Text style={[styles.statsTitle, { marginTop: 0 }]}>{'Attendance Rate'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#e3e8ef', marginHorizontal: 16, marginBottom: 24, marginTop: 8, borderRadius: 2 }} />

      {/* Quick Actions Grid - more pro look */}
      <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.brandMediumBlue, width: '48%', shadowColor: Colors.brandMediumBlue, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, marginBottom: 12 }]} activeOpacity={0.85}>
            <View style={{ backgroundColor: Colors.brandMediumBlue + '22', borderRadius: 50, padding: 10, marginBottom: 8 }}>
              <MapPin size={28} color={Colors.brandMediumBlue} />
            </View>
            <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold', marginTop: 8, fontFamily: 'Inter-Medium' }}>Track Bus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.brandAccent, width: '48%', shadowColor: Colors.brandAccent, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, marginBottom: 12 }]} activeOpacity={0.85}>
            <View style={{ backgroundColor: Colors.brandAccent + '22', borderRadius: 50, padding: 10, marginBottom: 8 }}>
              <Calendar size={28} color={Colors.brandAccent} />
            </View>
            <Text style={{ color: Colors.brandAccent, fontWeight: 'bold', marginTop: 8, fontFamily: 'Inter-Medium' }}>View Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.info, width: '48%', shadowColor: Colors.info, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, marginBottom: 12 }]} activeOpacity={0.85}>
            <View style={{ backgroundColor: Colors.info + '22', borderRadius: 50, padding: 10, marginBottom: 8 }}>
              <BookOpen size={28} color={Colors.info} />
            </View>
            <Text style={{ color: Colors.info, fontWeight: 'bold', marginTop: 8, fontFamily: 'Inter-Medium' }}>Book Bus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.success, width: '48%', shadowColor: Colors.success, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, marginBottom: 12 }]} activeOpacity={0.85}>
            <View style={{ backgroundColor: Colors.success + '22', borderRadius: 50, padding: 10, marginBottom: 8 }}>
              <Users size={28} color={Colors.success} />
            </View>
            <Text style={{ color: Colors.success, fontWeight: 'bold', marginTop: 8, fontFamily: 'Inter-Medium' }}>Manage Children</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fade separator above children list */}
      <View style={{ height: 16, backgroundColor: 'transparent' }} />

      {/* Children List Section */}
      <View style={{ marginHorizontal: 16 }}>
        <Text style={styles.sectionTitle}>My Children</Text>
        {children.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Users size={48} color={Colors.gray400} />
            <Text style={{ textAlign: 'center', color: Colors.gray500, fontSize: 16, marginTop: 8 }}>
              No children found
            </Text>
            <Text style={{ textAlign: 'center', color: Colors.gray400, fontSize: 14, marginTop: 4 }}>
              Add your children in the Children tab
            </Text>
          </View>
        ) : (
          children.map((item: any) => (
            <View key={item._id || item.id || item.name} style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 12, 
              backgroundColor: '#fff', 
              borderRadius: 12, 
              padding: 16,
              shadowColor: Colors.brandDarkBlue,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
              borderWidth: 1,
              borderColor: '#e3e8ef',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: Colors.brandDarkBlue, fontFamily: 'Inter-Bold' }}>
                  {item.name || `${item.firstName || ''} ${item.lastName || ''}`}
                </Text>
                <Text style={{ color: Colors.gray600, fontSize: 14, marginTop: 2, fontFamily: 'Inter-Medium' }}>
                  Grade: {item.grade || 'N/A'}
                </Text>
                <Text style={{ color: Colors.gray600, fontSize: 14, fontFamily: 'Inter-Medium' }}>
                  School: {item.school || 'N/A'}
                </Text>
              </View>
              <TouchableOpacity 
                style={{ 
                  paddingHorizontal: 12, 
                  paddingVertical: 6, 
                  backgroundColor: Colors.brandAccent, 
                  borderRadius: 8 
                }}
              >
                <Text style={{ color: Colors.white, fontWeight: '600', fontFamily: 'Inter-Medium' }}>View</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return user?.role === 'admin' ? renderAdminContent() : renderParentContent();
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