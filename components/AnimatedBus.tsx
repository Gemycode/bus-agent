import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface AnimatedBusProps {
  size?: number;
  color?: string;
}

export const AnimatedBus: React.FC<AnimatedBusProps> = ({ 
  size = 40, 
  color = Colors.brandDarkBlue 
}) => {
  return (
    <View style={[styles.container, { backgroundColor: Colors.gray100 }]}> {/* Restore background color */}
      <View style={styles.road} />
      <View style={styles.busContainer}>
        <MaterialCommunityIcons name="bus" size={size} color={color} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
  },
  road: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.gray400,
  },
  busContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});