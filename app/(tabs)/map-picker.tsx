// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { FontAwesome } from '@expo/vector-icons';
// import MapPicker from '../../components/MapPicker';

// export default function MapPickerScreen() {
//   const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

//   return (
//     <View style={styles.container}>
//       {/* Header Section */}
//       <View style={styles.headerSection}>
//         <View style={styles.iconContainer}>
//           <FontAwesome name="map-marker" size={32} color="#1976d2" />
//         </View>
//         <Text style={styles.title}>اختيار موقع على الخريطة</Text>
//         <Text style={styles.subtitle}>اضغط على الخريطة لتحديد الموقع المطلوب</Text>
//       </View>

//       {/* Map Container */}
//       <View style={styles.mapContainer}>
//         <MapPicker
//           label=""
//           onLocationSelect={setCoords}
//         />
//         {/* Map Overlay Instructions */}
//         {!coords && (
//           <View style={styles.instructionsOverlay}>
//             <View style={styles.instructionBubble}>
//               <FontAwesome name="hand-pointer-o" size={20} color="#1976d2" />
//               <Text style={styles.instructionText}>اضغط هنا لاختيار الموقع</Text>
//             </View>
//           </View>
//         )}
//       </View>

//       {/* Coordinates Display */}
//       {coords && (
//         <View style={styles.coordsContainer}>
//           <View style={styles.coordsHeader}>
//             <FontAwesome name="check-circle" size={20} color="#4caf50" />
//             <Text style={styles.coordsTitle}>تم تحديد الموقع بنجاح</Text>
//           </View>
          
//           <View style={styles.coordsBox}>
//             <View style={styles.coordRow}>
//               <View style={styles.coordLabel}>
//                 <FontAwesome name="arrows-v" size={14} color="#666" />
//                 <Text style={styles.coordLabelText}>خط العرض</Text>
//               </View>
//               <Text style={styles.coordValue}>{coords.latitude.toFixed(6)}</Text>
//             </View>
            
//             <View style={styles.separator} />
            
//             <View style={styles.coordRow}>
//               <View style={styles.coordLabel}>
//                 <FontAwesome name="arrows-h" size={14} color="#666" />
//                 <Text style={styles.coordLabelText}>خط الطول</Text>
//               </View>
//               <Text style={styles.coordValue}>{coords.longitude.toFixed(6)}</Text>
//             </View>
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.actionButtons}>
//             <TouchableOpacity style={styles.copyButton} activeOpacity={0.8}>
//               <FontAwesome name="copy" size={16} color="#1976d2" />
//               <Text style={styles.copyButtonText}>نسخ الإحداثيات</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity style={styles.resetButton} activeOpacity={0.8} onPress={() => setCoords(null)}>
//               <FontAwesome name="refresh" size={16} color="#ff5722" />
//               <Text style={styles.resetButtonText}>إعادة تعيين</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {/* Bottom Spacer for better layout */}
//       <View style={styles.bottomSpacer} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   headerSection: {
//     paddingTop: 60,
//     paddingHorizontal: 24,
//     paddingBottom: 24,
//     backgroundColor: '#fff',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 8,
//     alignItems: 'center',
//   },
//   iconContainer: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: '#e3f2fd',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//     shadowColor: '#1976d2',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '800',
//     color: '#1a1a1a',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#64748b',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   mapContainer: {
//     flex: 1,
//     marginHorizontal: 16,
//     marginTop: 20,
//     borderRadius: 24,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 8,
//     },
//     shadowOpacity: 0.15,
//     shadowRadius: 16,
//     elevation: 12,
//     backgroundColor: '#fff',
//     position: 'relative',
//   },
//   instructionsOverlay: {
//     position: 'absolute',
//     top: 24,
//     left: 24,
//     right: 24,
//     zIndex: 10,
//     alignItems: 'center',
//   },
//   instructionBubble: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(25, 118, 210, 0.95)',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 25,
//     shadowColor: '#1976d2',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   instructionText: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   coordsContainer: {
//     marginHorizontal: 16,
//     marginTop: 20,
//     marginBottom: 24,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   coordsHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   coordsTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#4caf50',
//     marginLeft: 8,
//   },
//   coordsBox: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   coordRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   coordLabel: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   coordLabelText: {
//     fontSize: 15,
//     color: '#64748b',
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   coordValue: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#1e293b',
//     fontFamily: 'monospace',
//   },
//   separator: {
//     height: 1,
//     backgroundColor: '#e2e8f0',
//     marginVertical: 4,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     marginTop: 20,
//     gap: 12,
//   },
//   copyButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#e3f2fd',
//     paddingVertical: 14,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#1976d2',
//   },
//   copyButtonText: {
//     color: '#1976d2',
//     fontSize: 15,
//     fontWeight: '700',
//     marginLeft: 8,
//   },
//   resetButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#ffebee',
//     paddingVertical: 14,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#ff5722',
//   },
//   resetButtonText: {
//     color: '#ff5722',
//     fontSize: 15,
//     fontWeight: '700',
//     marginLeft: 8,
//   },
//   bottomSpacer: {
//     height: 20,
//   },
// });