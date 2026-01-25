import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const AnimatedMeshGradient = () => {
    // We will animate 3 glowing blobs
    const blob1Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const blob2Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const blob3Anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

    useEffect(() => {
        const createAnimation = (anim, start, end, duration) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: end,
                        duration: duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true, // Use native driver for performance
                    }),
                    Animated.timing(anim, {
                        toValue: start,
                        duration: duration,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = createAnimation(blob1Anim, { x: 0, y: 0 }, { x: 100, y: 200 }, 8000);
        const anim2 = createAnimation(blob2Anim, { x: 0, y: 0 }, { x: -150, y: 100 }, 7000);
        const anim3 = createAnimation(blob3Anim, { x: 0, y: 0 }, { x: 50, y: -150 }, 9000);

        anim1.start();
        anim2.start();
        anim3.start();
    }, []);

    // Helper to create a blob
    const renderBlob = (anim, color, size, initialPos) => (
        <Animated.View
            style={[
                styles.blob,
                {
                    backgroundColor: color,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    top: initialPos.y,
                    left: initialPos.x,
                    transform: [
                        { translateX: anim.x },
                        { translateY: anim.y },
                    ],
                },
            ]}
        />
    );

    return (
        <View style={styles.container}>
            <View style={styles.background} />
            {renderBlob(blob1Anim, COLORS.primary + '40', 400, { x: -100, y: -100 })}
            {renderBlob(blob2Anim, '#4CAF5040', 350, { x: width - 200, y: height / 3 })}
            {renderBlob(blob3Anim, '#2196F330', 450, { x: -50, y: height - 400 })}

            {/* Overlay blur to mesh them together */}
            <BlurView intensity={50} style={styles.blurOverlay} tint="light" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF', // Light base
    },
    blob: {
        position: 'absolute',
        opacity: 0.6,
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
    }
});

export default AnimatedMeshGradient;
