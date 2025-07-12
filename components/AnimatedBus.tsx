import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Bus } from 'lucide-react-native';
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
    <View style={styles.container}>
      <View style={styles.road} />
      <Animated.View
        style={[
          styles.busContainer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <Bus size={size} color={color} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    overflow: 'hidden',
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