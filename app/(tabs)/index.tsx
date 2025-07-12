import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Modal, TextInput, TouchableOpacity, FlatList } from 'react-native';
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
        const buses = busesRaw as any[];
        const users = usersRaw as any[];
        const attendances = attendancesRaw as any[];
        const attendanceStats = attendanceStatsRaw as any;
        const today = new Date().toISOString().slice(0, 10);
        const students = users.filter((u: any) => u.role === 'student');
        const parents = users.filter((u: any) => u.role === 'parent');
        const absencesToday = attendances.filter((a: any) => a.date && a.date.startsWith(today) && a.status === 'absent');
        setStats({
          totalBuses: Number(buses.length),
          activeBuses: Number(buses.filter((bus: any) => bus.status === 'active').length),
          totalStudents: Number(students.length),
          totalParents: Number(parents.length),
          absencesToday: Number(absencesToday.length),
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

  const handleAddStop = () => {
    setRouteForm(prev => ({ ...prev, stops: [...prev.stops, ''] }));
  };
  const handleRemoveStop = (idx: number) => {
    setRouteForm(prev => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }));
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

  const renderAdminStats = () => (
    <View style={styles.statsGrid}>
      {renderStatsCard(
        'Total Buses',
        stats.totalBuses || 0,
        <Bus size={24} color={Colors.brandMediumBlue} />, 
        Colors.brandMediumBlue
      )}
      {renderStatsCard(
        'Active Buses',
        stats.activeBuses || 0,
        <Bus size={24} color={Colors.success} />, 
        Colors.success
      )}
      {renderStatsCard(
        'Total Students',
        stats.totalStudents || 0,
        <Users size={24} color={Colors.brandAccent} />, 
        Colors.brandAccent
      )}
      {renderStatsCard(
        'Total Parents',
        stats.totalParents || 0,
        <Users size={24} color={Colors.info} />, 
        Colors.info
      )}
      {renderStatsCard(
        'Absences Today',
        stats.absencesToday || 0,
        <Calendar size={24} color={Colors.error} />, 
        Colors.error
      )}
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        {(user?.role === 'admin' || user?.role === 'manager') && renderAdminStats()}
        {user?.role === 'parent' && renderParentStats()}
      </View>

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

      <Modal visible={showRouteModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Add New Route</Text>
            <TextInput
              placeholder="Route Name"
              value={routeForm.name}
              onChangeText={v => handleRouteInputChange('name', v)}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <TextInput
              placeholder="Start Point"
              value={routeForm.start_point}
              onChangeText={v => handleRouteInputChange('start_point', v)}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <TextInput
              placeholder="End Point"
              value={routeForm.end_point}
              onChangeText={v => handleRouteInputChange('end_point', v)}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <TextInput
              placeholder="Estimated Time (e.g. 45 min)"
              value={routeForm.estimated_time}
              onChangeText={v => handleRouteInputChange('estimated_time', v)}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 }}
            />
            <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Stops</Text>
            <FlatList
              data={routeForm.stops}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({ item, index }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <TextInput
                    placeholder={`Stop #${index + 1}`}
                    value={item}
                    onChangeText={v => handleStopChange(index, v)}
                    style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 }}
                  />
                  {routeForm.stops.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveStop(index)} style={{ marginLeft: 8 }}>
                      <Text style={{ color: 'red', fontWeight: 'bold' }}>X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
            <TouchableOpacity onPress={handleAddStop} style={{ marginVertical: 8 }}>
              <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold' }}>+ Add Stop</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowRouteModal(false)} style={{ marginRight: 16 }} disabled={savingRoute}>
                <Text style={{ color: '#888' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveRoute} disabled={savingRoute}>
                <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold' }}>{savingRoute ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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