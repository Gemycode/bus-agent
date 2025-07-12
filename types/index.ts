export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'driver' | 'parent' | 'manager';
  phone?: string;
  avatar?: string;
  children?: Child[];
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  busId?: string;
  routeId?: string;
}

export interface Bus {
  id: string;
  number: string;
  capacity: number;
  driverId: string;
  routeId: string;
  status: 'active' | 'inactive' | 'maintenance';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Route {
  id: string;
  name: string;
  description: string;
  stops: RouteStop[];
  busId?: string;
  estimatedDuration: number;
}

export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  estimatedTime: string;
  order: number;
}

export interface Attendance {
  id: string;
  userId: string;
  busId: string;
  routeId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  checkInTime?: string;
  checkOutTime?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  childId: string;
  routeId: string;
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  pickupStop: string;
  dropoffStop: string;
}