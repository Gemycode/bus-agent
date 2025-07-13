# نظام إدارة الحافلات المدرسية - Bus Management System

نظام متكامل لإدارة الحافلات المدرسية مع واجهة مستخدم حديثة وتتبع في الوقت الفعلي.

## 🚌 المميزات الرئيسية

### للآباء (Parents)
- **تتبع الحافلات في الوقت الفعلي** - مشاهدة موقع الحافلة مباشرة
- **حجز رحلات الحافلة** - حجز مقاعد للأبناء مع اختيار الطريق والتاريخ
- **إدارة الحضور** - متابعة حضور الأبناء وإحصائيات الحضور
- **إدارة الأبناء** - إضافة وتعديل وحذف بيانات الأبناء
- **الإشعارات** - استقبال تنبيهات مهمة عن الحافلات والحضور
- **لوحة تحكم شخصية** - عرض إحصائيات خاصة بالعائلة

### للسائقين (Drivers)
- **تحديث الموقع** - تحديث موقع الحافلة في الوقت الفعلي
- **إدارة الحضور** - تسجيل حضور الطلاب
- **معلومات الطريق** - عرض تفاصيل الطريق والمحطات
- **حالة الحافلة** - تحديث حالة الحافلة (نشطة/متوقفة/صيانة)

### للمديرين (Managers/Admins)
- **إدارة الحافلات** - إضافة وتعديل وحذف الحافلات
- **إدارة الطرق** - إنشاء وتعديل طرق الحافلات
- **إدارة السائقين** - إدارة بيانات السائقين وتراخيصهم
- **إدارة المستخدمين** - إدارة جميع المستخدمين في النظام
- **التقارير** - عرض تقارير شاملة عن الأداء

## 🛠️ التقنيات المستخدمة

### Frontend
- **React Native** - تطبيق الهاتف المحمول
- **Expo** - إطار عمل React Native
- **TypeScript** - لكتابة كود آمن ومنظم
- **Lucide React Native** - أيقونات جميلة
- **React Native Maps** - خرائط تفاعلية
- **AsyncStorage** - تخزين البيانات محلياً

### Backend
- **Node.js** - خادم JavaScript
- **Express.js** - إطار عمل الويب
- **MongoDB** - قاعدة بيانات NoSQL
- **Mongoose** - ODM لـ MongoDB
- **JWT** - مصادقة المستخدمين
- **Socket.io** - اتصال في الوقت الفعلي
- **Multer** - رفع الملفات
- **Nodemailer** - إرسال البريد الإلكتروني

## 📱 واجهات التطبيق

### 1. لوحة التحكم (Dashboard)
- عرض إحصائيات عامة
- إحصائيات خاصة بالدور (أب/مدير/سائق)
- أزرار الوصول السريع للوظائف المهمة

### 2. تتبع الحافلات (Tracking)
- خريطة تفاعلية لمواقع الحافلات
- معلومات مفصلة عن كل حافلة
- تحديث تلقائي كل 30 ثانية

### 3. الحجز (Booking)
- حجز رحلات الحافلة للأبناء
- اختيار الطريق والتاريخ والحافلة
- إدارة الحجوزات (تأكيد/إلغاء)

### 4. الحضور (Attendance)
- تسجيل حضور الطلاب
- عرض إحصائيات الحضور
- تقارير الحضور

### 5. الإشعارات (Notifications)
- عرض الإشعارات المهمة
- تحديثات الحافلات والحضور
- إشعارات النظام

### 6. إدارة الأبناء (Children)
- إضافة وتعديل وحذف بيانات الأبناء
- ربط الأبناء بالحافلات والطرق
- عرض معلومات الأبناء

### 7. الملف الشخصي (Profile)
- معلومات المستخدم
- تغيير كلمة المرور
- إعدادات الحساب

## 🚀 التثبيت والتشغيل

### متطلبات النظام
- Node.js (v16 أو أحدث)
- MongoDB (v4.4 أو أحدث)
- Expo CLI
- React Native CLI

### تثبيت Backend

```bash
cd backend-BusMS
npm install
```

### إعداد متغيرات البيئة

أنشئ ملف `.env` في مجلد `backend-BusMS`:

```env
MONGODB_URI=mongodb://localhost:27017/bus-management-system
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
PORT=5000
```

### تشغيل Backend

```bash
npm start
```

### إضافة بيانات تجريبية

```bash
npm run seed
```

### تثبيت Frontend

```bash
npm install
```

### إعداد متغيرات البيئة للـ Frontend

أنشئ ملف `.env` في المجلد الرئيسي:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.84:5000/api
```

### تشغيل Frontend

```bash
npm start
```

## 📊 قاعدة البيانات

### النماذج الرئيسية

#### المستخدم (User)
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: ['admin', 'driver', 'parent', 'student'],
  parentId: ObjectId,
  children: [ObjectId],
  licenseNumber: String, // للسائقين
  phone: String,
  profileImage: String
}
```

#### الحافلة (Bus)
```javascript
{
  BusNumber: String,
  capacity: Number,
  status: ['active', 'Maintenance', 'inactive'],
  assigned_driver_id: ObjectId,
  route_id: ObjectId
}
```

#### الطريق (Route)
```javascript
{
  name: String,
  start_point: { name: String, lat: Number, long: Number },
  end_point: { name: String, lat: Number, long: Number },
  stops: [{ name: String, lat: Number, long: Number }],
  estimated_time: String
}
```

#### الحجز (Booking)
```javascript
{
  studentId: ObjectId,
  parentId: ObjectId,
  busId: ObjectId,
  routeId: ObjectId,
  date: Date,
  status: ['pending', 'confirmed', 'cancelled', 'completed'],
  pickupLocation: { name: String, lat: Number, long: Number },
  dropoffLocation: { name: String, lat: Number, long: Number },
  notes: String
}
```

#### موقع الحافلة (BusLocation)
```javascript
{
  busId: ObjectId,
  driverId: ObjectId,
  routeId: ObjectId,
  currentLocation: { latitude: Number, longitude: Number },
  speed: Number,
  heading: Number,
  status: ['active', 'stopped', 'maintenance', 'offline'],
  currentStop: { name: String, lat: Number, long: Number },
  nextStop: { name: String, lat: Number, long: Number },
  estimatedArrival: Date,
  lastUpdate: Date
}
```

## 🔐 الأمان

- **JWT Authentication** - مصادقة آمنة للمستخدمين
- **Role-based Access Control** - تحكم في الصلاحيات حسب الدور
- **Password Hashing** - تشفير كلمات المرور
- **Input Validation** - التحقق من صحة البيانات المدخلة
- **Rate Limiting** - حماية من الهجمات

## 📡 API Endpoints

### المستخدمون
- `POST /api/users/login` - تسجيل الدخول
- `POST /api/users/register` - تسجيل مستخدم جديد
- `GET /api/users/me` - معلومات المستخدم الحالي

### الحافلات
- `GET /api/buses/all` - جلب جميع الحافلات
- `POST /api/buses/create` - إنشاء حافلة جديدة
- `PUT /api/buses/update/:id` - تحديث حافلة

### الطرق
- `GET /api/routes/` - جلب جميع الطرق
- `POST /api/routes/` - إنشاء طريق جديد
- `PUT /api/routes/:id` - تحديث طريق

### الحجز
- `POST /api/bookings/create` - إنشاء حجز جديد
- `GET /api/bookings/parent` - حجوزات الوالد
- `DELETE /api/bookings/cancel/:id` - إلغاء الحجز
- `GET /api/bookings/available-buses` - الحافلات المتاحة

### مواقع الحافلات
- `GET /api/bus-locations/active` - مواقع الحافلات النشطة
- `POST /api/bus-locations/update` - تحديث موقع الحافلة
- `GET /api/bus-locations/bus/:id` - موقع حافلة محددة

## 🎯 المميزات المتقدمة

### التتبع في الوقت الفعلي
- تحديث موقع الحافلة كل 30 ثانية
- عرض سرعة الحافلة واتجاهها
- تقدير وقت الوصول للمحطة التالية

### نظام الحجز الذكي
- التحقق من توفر المقاعد
- منع الحجز المزدوج لنفس الطالب
- حساب المقاعد المتاحة تلقائياً

### الإشعارات الذكية
- إشعارات وصول الحافلة
- تنبيهات تأخير الحافلة
- إشعارات تغيير الطريق

### التقارير والإحصائيات
- إحصائيات الحضور اليومية
- تقارير أداء السائقين
- تحليل استخدام الحافلات

## 🔧 الصيانة والتطوير

### إضافة ميزات جديدة
1. إنشاء نموذج البيانات الجديد
2. إضافة Controller للوظائف الجديدة
3. إنشاء Routes للـ API
4. تحديث Frontend لإضافة الواجهات الجديدة

### تحسين الأداء
- استخدام Indexing في قاعدة البيانات
- تحسين استعلامات MongoDB
- استخدام Caching للبيانات المتكررة

### الأمان
- تحديث JWT tokens دورياً
- إضافة Two-factor authentication
- تشفير البيانات الحساسة

## 📞 الدعم والمساعدة

للمساعدة والدعم التقني:
- إنشاء Issue في GitHub
- التواصل عبر البريد الإلكتروني
- مراجعة الوثائق التقنية

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

**تم تطوير هذا النظام بواسطة فريق تطوير محترف مع التركيز على سهولة الاستخدام والأمان والأداء العالي.** 