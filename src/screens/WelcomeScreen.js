import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const WelcomeScreen = ({ navigation }) => {
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <Video
                source={{ uri: 'https://cdn.pixabay.com/video/2024/01/24/198018-906226540_large.mp4' }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                isLooping
                shouldPlay
                isMuted
            />

            <View style={styles.content}>
                <BlurView intensity={60} tint="dark" style={styles.card}>
                    <Text style={styles.title}>Raio-X Score 5</Text>
                    <Text style={styles.subtitle}>Sistema de Análise de Performance</Text>

                    <Animated.View style={[styles.robotContainer, { transform: [{ translateY: floatAnim }] }]}>
                        <View style={styles.robotImage}>
                            <Video
                                source={{ uri: 'https://cdn.pixabay.com/video/2023/01/09/145864-787701151_tiny.mp4' }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
                                isLooping
                                shouldPlay
                                isMuted
                            />
                        </View>
                    </Animated.View>

                    <Text style={styles.companyInfo}>
                        Desenvolvido pela <Text style={styles.companyName}>DIRETA MG</Text>
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.replace('MainTabs')}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.buttonText}>⚡ Iniciar Conversa</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </BlurView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    content: {
        alignItems: 'center',
    },
    card: {
        width: '100%',
        padding: SPACING.xl,
        borderRadius: RADIUS.xxl,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.primaryLight,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textInverse,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    robotContainer: {
        marginBottom: SPACING.xl,
    },
    robotImage: {
        width: 120,
        height: 120,
        backgroundColor: '#000',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
    },
    companyInfo: {
        color: COLORS.textInverse,
        marginBottom: SPACING.xl,
    },
    companyName: {
        color: COLORS.primaryLight,
        fontWeight: 'bold',
    },
    button: {
        width: '100%',
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    buttonGradient: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.textInverse,
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default WelcomeScreen;
