import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
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
  const translateX = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 50,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -50,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [translateX]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.gray100 }]}> {/* Restore background color */}
      <View style={styles.road} />
      <Animated.View
        style={[
          styles.busContainer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Use MaterialCommunityIcons bus icon for compatibility */}
        <MaterialCommunityIcons name="bus" size={size} color={color} />
      </Animated.View>
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
    // overflow intentionally not set to avoid clipping
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
  },
});