import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/BoasVind.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
                onLoadEnd={() => setImageLoaded(true)}
            >
                {/* Loading Indicator */}
                {!imageLoaded && (
                    <LinearGradient
                        colors={['#000000', '#1A1A1A', '#332B00']} // Gradient from Black to Dark Yellowish-Black
                        style={styles.loadingContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Carregando...</Text>
                    </LinearGradient>
                )}

                {/* TV Screen Video Overlay */}
                {/* Adjusted coordinates to move UP into the monitor head */}
                <View style={styles.tvScreenContainer}>
                    <Video
                        source={{ uri: 'https://cdn.pixabay.com/video/2023/01/09/145864-787701151_tiny.mp4' }}
                        style={styles.video}
                        resizeMode="cover"
                        isLooping
                        shouldPlay
                        isMuted
                    />
                </View>

                {/* Gradient Overlay for Text Readability at Bottom */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                    style={styles.bottomGradient}
                >
                    <View style={styles.bottomContent}>
                        {/* Title is removed as it's likely in the artwork, but we keep the subtitle/button */}
                        <Text style={styles.title}>Raio-X <Text style={styles.titleHighlight}>Score 5</Text></Text>
                        <Text style={styles.subtitle}>Sistema de Análise de Performance</Text>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.replace('MainTabs')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>⚡ INICIAR CONVERSA</Text>
                        </TouchableOpacity>

                        <Text style={styles.companyInfo}>
                            Desenvolvido pela <Text style={styles.companyName}>DIRETA MG</Text>
                        </Text>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    loadingText: {
        marginTop: SPACING.md,
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    tvScreenContainer: {
        position: 'absolute',
        // Fine-tuning alignment based on feedback
        top: height * 0.165, // Moved DOWN slightly
        left: width * 0.362, // Slight nudge right
        width: width * 0.27, // Slightly narrower to fit bezel
        height: height * 0.09, // Slightly taller
        backgroundColor: '#000',
        borderRadius: 4,
        overflow: 'hidden',
        transform: [{ rotate: '-1.5deg' }], // Adjusted rotation
        zIndex: 10,
    },
    video: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: SPACING.xxl * 2,
        paddingBottom: SPACING.xl,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'flex-end',
    },
    bottomContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: SPACING.xs,
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    titleHighlight: {
        color: COLORS.primary, // Bees Yellow
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: SPACING.xl,
        letterSpacing: 0.5,
    },
    button: {
        width: '100%',
        height: 56,
        backgroundColor: COLORS.primary, // Bees Yellow
        borderRadius: RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.lg,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    buttonText: {
        color: '#1A1A1A', // Black text
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    companyInfo: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        fontSize: 10,
    },
    companyName: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default WelcomeScreen;
