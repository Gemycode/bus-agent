import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.84:5000/api';

class ApiService {
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

    console.log(`API Request: ${API_BASE_URL}${endpoint}`, config);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
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

  async register(userData: any) {
    const formData = new FormData();
    function isImageFile(obj: any): obj is { uri: string; name?: string; type?: string } {
      return obj && typeof obj === 'object' && typeof obj.uri === 'string';
    }
    Object.entries(userData).forEach(([key, value]) => {
      if (key === 'image' && isImageFile(value)) {
        formData.append('image', {
          uri: value.uri,
          name: value.name || 'profile.jpg',
          type: value.type || 'image/jpeg',
        } as any);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return response.json();
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

  // Routes endpoints
  async getRoutes() {
    return this.request('/routes/');
  }

  async createRoute(routeData: any) {
    return this.request('/routes/', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
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

  // Notifications endpoints
  async getNotifications(userId: string) {
    return this.request(`/notifications/${userId}`);
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