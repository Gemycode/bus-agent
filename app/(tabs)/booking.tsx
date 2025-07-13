import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { Colors } from '../../constants/Colors';
import { Bus, Route, Booking, User } from '../../types';
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface BookingFormData {
  studentId: string;
  busId: string;
  routeId: string;
  date: Date;
  pickupLocation: {
    name: string;
    lat: number;
    long: number;
  };
  dropoffLocation: {
    name: string;
    lat: number;
    long: number;
  };
  notes: string;
}

export default function BookingScreen() {
  const { user } = useAuth();
  // 1. When fetching children, treat as any[]
  const [children, setChildren] = useState<any[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [availableBuses, setAvailableBuses] = useState<Bus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  // Change selectedChild type to any
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState<BookingFormData>({
    studentId: '',
    busId: '',
    routeId: '',
    date: new Date(),
    pickupLocation: { name: '', lat: 0, long: 0 },
    dropoffLocation: { name: '', lat: 0, long: 0 },
    notes: ''
  });
  // 1. Add state for pickupLocations and dropoffLocations
  const [pickupLocations, setPickupLocations] = useState<any[]>([]);
  const [dropoffLocations, setDropoffLocations] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [childrenRes, routesData, bookingsData] = await Promise.all([
        apiService.getMyChildren() as Promise<any>,
        apiService.getAllRoutes() as Promise<any>,
        apiService.getParentBookings() as Promise<any>
      ]);

      // Always extract children array from backend response
      let childrenList: any[] = [];
      if (childrenRes && childrenRes.success && childrenRes.data && Array.isArray(childrenRes.data.children)) {
        childrenList = childrenRes.data.children;
      } else if (childrenRes && Array.isArray(childrenRes.children)) {
        childrenList = childrenRes.children;
      } else if (Array.isArray(childrenRes)) {
        childrenList = childrenRes;
      } else {
        childrenList = [];
      }

      setChildren(childrenList);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
      setChildren([]);
      setRoutes([]);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. When a route is selected, fetch its stops and set pickup/dropoff options
  const handleRouteSelect = async (route: Route) => {
    setSelectedRoute(route);
    setFormData(prev => ({ ...prev, routeId: route._id }));
    try {
      const allBuses = await apiService.getAllBuses();
      // Robust filtering for all possible route_id shapes
      const busesForRoute = Array.isArray(allBuses)
        ? allBuses.filter((bus: any) => {
            // route_id can be string, ObjectId, or populated object
            if (!bus.route_id) return false;
            if (typeof bus.route_id === 'string') {
              return bus.route_id === route._id;
            }
            if (typeof bus.route_id === 'object') {
              // If populated, may have _id
              return (
                bus.route_id._id?.toString() === route._id.toString() ||
                bus.route_id.toString() === route._id.toString()
              );
            }
            // fallback
            return false;
          })
        : [];
      setAvailableBuses(busesForRoute);
      const stops = route.stops || [];
      setPickupLocations(stops);
      setDropoffLocations(stops);
    } catch (error) {
      Alert.alert('Error', 'Failed to load available buses or stops.\n' + ((error as any)?.message || ''));
    }
  };

  const handleChildSelect = (child: any) => {
    setSelectedChild(child);
    setFormData(prev => ({ ...prev, studentId: child._id || child.id }));
  };

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus);
    setFormData(prev => ({ ...prev, busId: bus._id }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setFormData(prev => ({ ...prev, date }));
      if (selectedRoute) {
        handleRouteSelect(selectedRoute);
      }
    }
  };

  const handleCreateBooking = async () => {
    if (!formData.studentId || !formData.busId || !formData.routeId) {
      Alert.alert('Error', 'Please select a child, bus, and route.');
      return;
    }

    if (!formData.pickupLocation.name || !formData.dropoffLocation.name) {
      Alert.alert('Error', 'Please enter pickup and dropoff locations.');
      return;
    }

    try {
      const booking = await apiService.createBooking(formData);
      Alert.alert('Success', 'Booking created successfully!');
      setShowBookingModal(false);
      loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to create booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelBooking(bookingId);
              Alert.alert('Success', 'Booking cancelled successfully!');
              loadData();
            } catch (error) {
              console.error('Failed to cancel booking:', error);
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      busId: '',
      routeId: '',
      date: new Date(),
      pickupLocation: { name: '', lat: 0, long: 0 },
      dropoffLocation: { name: '', lat: 0, long: 0 },
      notes: ''
    });
    setSelectedRoute(null);
    setSelectedChild(null);
    setSelectedBus(null);
    setSelectedDate(new Date());
    setAvailableBuses([]);
    setPickupLocations([]);
    setDropoffLocations([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'cancelled': return Colors.error;
      case 'completed': return Colors.info;
      default: return Colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} color={Colors.success} />;
      case 'cancelled': return <XCircle size={16} color={Colors.error} />;
      default: return <Clock size={16} color={Colors.warning} />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bus Bookings</Text>
        <Text style={styles.headerSubtitle}>
          Book bus rides for your children
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Bookings</Text>
            <CustomButton
              title="New Booking"
              onPress={() => setShowBookingModal(true)}
              variant="primary"
              size="small"
            />
          </View>

          {Array.isArray(bookings) && bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={48} color={Colors.gray400} />
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first booking to get started.
              </Text>
            </View>
          ) : (
            Array.isArray(bookings) && bookings.map((booking) => (
              <View key={booking._id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingTitle}>
                      {booking.studentId.firstName} {booking.studentId.lastName}
                    </Text>
                    <Text style={styles.bookingSubtitle}>
                      Bus {booking.busId.BusNumber} • {booking.routeId.name}
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(booking.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color={Colors.gray600} />
                    <Text style={styles.detailText}>
                      {new Date(booking.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={Colors.gray600} />
                    <Text style={styles.detailText}>
                      {booking.pickupLocation.name} → {booking.dropoffLocation.name}
                    </Text>
                  </View>
                </View>

                {booking.status === 'pending' && (
                  <View style={styles.bookingActions}>
                    <CustomButton
                      title="Cancel"
                      onPress={() => handleCancelBooking(booking._id)}
                      variant="outline"
                      size="small"
                      style={styles.actionButton}
                    />
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Booking</Text>
            <CustomButton
              title="Close"
              onPress={() => {
                setShowBookingModal(false);
                resetForm();
              }}
              variant="outline"
              size="small"
            />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Select Child */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Child</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array.isArray(children) && children.map((child: any) => (
                  <CustomButton
                    key={child._id || child.id}
                    title={`${child.firstName || child.name || ''} ${child.lastName || ''}`.trim()}
                    onPress={() => handleChildSelect(child)}
                    variant={selectedChild?._id === (child._id || child.id) ? 'primary' : 'outline'}
                    size="small"
                    style={styles.selectionButton}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Select Date */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Date</Text>
              <CustomButton
                title={selectedDate.toLocaleDateString()}
                onPress={() => setShowDatePicker(true)}
                variant="outline"
                size="medium"
              />
            </View>

            {/* Select Route */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Route</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array.isArray(routes) && routes.map((route) => (
                  <CustomButton
                    key={route._id}
                    title={route.name}
                    onPress={() => handleRouteSelect(route)}
                    variant={selectedRoute?._id === route._id ? 'primary' : 'outline'}
                    size="small"
                    style={styles.selectionButton}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Select Bus */}
            {selectedRoute && Array.isArray(availableBuses) && availableBuses.length > 0 && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Bus</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Array.isArray(availableBuses) && availableBuses.map((bus) => (
                    <CustomButton
                      key={bus._id}
                      title={`Bus ${bus.BusNumber} (${bus.availableSeats} seats)`}
                      onPress={() => handleBusSelect(bus)}
                      variant={selectedBus?._id === bus._id ? 'primary' : 'outline'}
                      size="small"
                      style={styles.selectionButton}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Pickup Location */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Pickup Location</Text>
              <Picker
                selectedValue={formData.pickupLocation.name}
                onValueChange={(value: string) => {
                  const stop = pickupLocations.find(s => s.name === value);
                  setFormData(prev => ({
                    ...prev,
                    pickupLocation: stop || { name: value, lat: 0, long: 0 }
                  }));
                }}
              >
                {pickupLocations.map((stop) => (
                  <Picker.Item key={stop.name} label={stop.name} value={stop.name} />
                ))}
              </Picker>
            </View>

            {/* Dropoff Location */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Dropoff Location</Text>
              <Picker
                selectedValue={formData.dropoffLocation.name}
                onValueChange={(value: string) => {
                  const stop = dropoffLocations.find(s => s.name === value);
                  setFormData(prev => ({
                    ...prev,
                    dropoffLocation: stop || { name: value, lat: 0, long: 0 }
                  }));
                }}
              >
                {dropoffLocations.map((stop) => (
                  <Picker.Item key={stop.name} label={stop.name} value={stop.name} />
                ))}
              </Picker>
            </View>

            {/* Notes */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <CustomInput
                placeholder="Any special instructions..."
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Create Booking Button */}
            <View style={styles.formSection}>
              <CustomButton
                title="Create Booking"
                onPress={handleCreateBooking}
                variant="primary"
                size="large"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: Colors.gray600,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray500,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
    marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray700,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.brandDarkBlue,
    marginBottom: 12,
  },
  selectionButton: {
    marginRight: 8,
    minWidth: 100,
  },
}); 