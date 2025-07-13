import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.84:5000/api';

class ApiService {
  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Refresh token failed: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      } else {
        throw new Error('No token returned from refresh token endpoint');
      }
      return data.token;
    } catch (error) {
      throw error;
    }
  }
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };


    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async registerSimple(userData: any) {
    return this.request('/users/register-simple', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async register(userData: any) {
    try {
      let body: FormData | string;
      let headers: Record<string, string> = {};
      const image = userData.image as { uri?: string; name?: string; type?: string } | undefined;
      const hasImage = image && typeof image === 'object' && typeof image.uri === 'string';
      
      if (hasImage) {
        body = new FormData();
        Object.entries(userData).forEach(([key, value]) => {
          if (key === 'image' && value && typeof value === 'object' && typeof (value as any).uri === 'string') {
            const img = value as { uri: string; name?: string; type?: string };
            (body as FormData).append('image', {
              uri: img.uri,
              name: img.name || 'profile.jpg',
              type: img.type || 'image/jpeg',
            } as any);
          } else if (value !== undefined && value !== null) {
            (body as FormData).append(key, String(value));
          }
        });
        // لا تضع Content-Type هنا، React Native يضبطها تلقائياً
      } else {
        body = JSON.stringify(userData);
        headers['Content-Type'] = 'application/json';
      }
      
      const token = await this.getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers,
        body,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API Error: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Network error: Please check your internet connection and make sure the server is running');
      }
      throw error;
    }
  }

  async getMe() {
    return this.request('/users/me');
  }

  // Children endpoints
  async getMyChildren() {
    return this.request('/users/me/children');
  }

  async addChild(childData: any) {
    return this.request('/users/me/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  }

  async deleteChild(childId: string) {
    return this.request(`/users/children/${childId}`, { method: 'DELETE' });
  }

  // Attendance endpoints
  async getAttendances() {
    return this.request('/attendances');
  }

  async getParentAttendances() {
    return this.request('/attendances/parent');
  }

  async createAttendance(attendanceData: any) {
    return this.request('/attendances', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async getAttendanceStats() {
    return this.request('/attendances/stats');
  }

  // Bus endpoints
  async getAllBuses() {
    return this.request('/buses/all');
  }

  async createBus(busData: any) {
    return this.request('/buses/create', {
      method: 'POST',
      body: JSON.stringify(busData),
    });
  }

  async updateBus(busId: string, busData: any) {
    return this.request(`/buses/${busId}`, {
      method: 'PUT',
      body: JSON.stringify(busData),
    });
  }

  async deleteBus(busId: string) {
    return this.request(`/buses/${busId}`, { method: 'DELETE' });
  }

  // Routes endpoints
  async getAllRoutes() {
    return this.request('/routes/');
  }

  async createRoute(routeData: any) {
    return this.request('/routes/', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  }

  async updateRoute(routeId: string, routeData: any) {
    return this.request(`/routes/${routeId}`, {
      method: 'PUT',
      body: JSON.stringify(routeData),
    });
  }

  async deleteRoute(routeId: string) {
    return this.request(`/routes/${routeId}`, { method: 'DELETE' });
  }

  async getAllDrivers() {
    // If you have a dedicated endpoint, use it. Otherwise, filter all users by role=driver
    const users = await this.request('/users/all');
    return Array.isArray(users) ? users.filter((u: any) => u.role === 'driver') : [];
  }

  // Tracking endpoints
  async getActiveBuses() {
    return this.request('/trackingRoutes/active-buses');
  }

  async getBusLocation(busId: string) {
    return this.request(`/trackingRoutes/bus/${busId}`);
  }

  async getBusHistory(busId: string) {
    return this.request(`/trackingRoutes/bus/${busId}/history`);
  }

  // New Bus Location endpoints
  async getActiveBusLocations() {
    return this.request('/bus-locations/active');
  }

  async getBusLocationById(busId: string) {
    return this.request(`/bus-locations/bus/${busId}`);
  }

  async getBusLocationsByRoute(routeId: string) {
    return this.request(`/bus-locations/route/${routeId}`);
  }

  // Booking endpoints
  async createBooking(bookingData: any) {
    return this.request('/bookings/create', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getParentBookings(status?: string, date?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (date) params.append('date', date);
    return this.request(`/bookings/parent?${params.toString()}`);
  }

  async getStudentBookings(studentId: string) {
    return this.request(`/bookings/student/${studentId}`);
  }

  async updateBookingStatus(bookingId: string, status: string) {
    return this.request(`/bookings/status/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async cancelBooking(bookingId: string) {
    return this.request(`/bookings/cancel/${bookingId}`, { method: 'DELETE' });
  }

  async getAvailableBuses(routeId: string, date: string) {
    const params = new URLSearchParams();
    params.append('routeId', routeId);
    params.append('date', date);
    return this.request(`/bookings/available-buses?${params.toString()}`);
  }

  // Notifications endpoints
  async getNotifications(userId: string) {
    return this.request(`/notifications/${userId}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  async getUnreadNotifications(userId: string) {
    return this.request(`/notifications/${userId}/unread`);
  }

  // Reports endpoints
  async exportReport(reportType: string, format: string) {
    return this.request(`/reports/export/${reportType}.${format}`);
  }

  async getAllUsers() {
    return this.request('/users/all');
  }
}

export const apiService = new ApiService();