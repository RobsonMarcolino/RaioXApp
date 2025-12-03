import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { COLORS } from '../constants/theme';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const LoadingScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start();

        // Simulate loading time then navigate
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 4000); // Increased slightly to enjoy the video

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Video
                source={{ uri: 'https://cdn.pixabay.com/video/2023/01/09/145864-787701151_tiny.mp4' }} // Robot/AI Tech Video
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                isLooping
                shouldPlay
                isMuted
            />

            {/* Blur removed for clear video */}

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.title}>Raio-X Score 5</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    content: {
        alignItems: 'center',
        zIndex: 10,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: 'rgba(0, 168, 255, 0.2)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },
    logoText: {
        fontSize: 50,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
        textShadowColor: COLORS.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
});

export default LoadingScreen;
