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
  _id: string;
  BusNumber: string;
  capacity: number;
  assigned_driver_id?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  route_id?: {
    _id: string;
    name: string;
    start_point: {
      name: string;
      lat: number;
      long: number;
    };
    end_point: {
      name: string;
      lat: number;
      long: number;
    };
  };
  status: 'active' | 'Maintenance' | 'inactive';
  availableSeats?: number;
  isAvailable?: boolean;
}

export interface Route {
  _id: string;
  name: string;
  start_point: {
    name: string;
    lat: number;
    long: number;
  };
  end_point: {
    name: string;
    lat: number;
    long: number;
  };
  stops: RouteStop[];
  estimated_time: string;
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
  _id: string;
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  parentId: string;
  busId: {
    _id: string;
    BusNumber: string;
    capacity: number;
  };
  routeId: {
    _id: string;
    name: string;
    start_point: {
      name: string;
      lat: number;
      long: number;
    };
    end_point: {
      name: string;
      lat: number;
      long: number;
    };
  };
  date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusLocation {
  _id: string;
  busId: {
    _id: string;
    BusNumber: string;
    capacity: number;
  };
  driverId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  routeId: {
    _id: string;
    name: string;
    start_point: {
      name: string;
      lat: number;
      long: number;
    };
    end_point: {
      name: string;
      lat: number;
      long: number;
    };
    stops: RouteStop[];
  };
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  speed: number;
  heading: number;
  status: 'active' | 'stopped' | 'maintenance' | 'offline';
  currentStop?: {
    name: string;
    lat: number;
    long: number;
  };
  nextStop?: {
    name: string;
    lat: number;
    long: number;
  };
  estimatedArrival?: string;
  lastUpdate: string;
}