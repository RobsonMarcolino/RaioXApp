import { View, Text, StyleSheet, TouchableOpacity, Linking, ImageBackground, Dimensions, Animated, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { BookOpen, ExternalLink } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const GUIDE_URL = "https://www.canva.com/design/DAG56u-5HwE/F5z_aBug3kjsi2pM2j6jRw/edit?utm_content=DAG56u-5HwE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";

const GuideScreen = () => {
    const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
    const opacityAnim = React.useRef(new Animated.Value(0)).current;
    const translateYAnim = React.useRef(new Animated.Value(50)).current; // Slide up slightly
    const insets = useSafeAreaInsets();

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(translateYAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: Platform.OS !== 'web',
            })
        ]).start();
    }, []);

    const handleOpenGuide = async () => {
        const supported = await Linking.canOpenURL(GUIDE_URL);
        if (supported) {
            await Linking.openURL(GUIDE_URL);
        } else {
            alert(`Não foi possível abrir o link: ${GUIDE_URL}`);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/GuiaDeBolso.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <Animated.View style={[
                styles.content,
                {
                    opacity: opacityAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: translateYAnim }
                    ]
                }
            ]}>
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        padding: SPACING.lg,
                        paddingTop: insets.top + SPACING.lg,
                        paddingBottom: insets.bottom + SPACING.lg
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <BlurView intensity={40} tint="dark" style={styles.glassCard}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Guia de Bolso</Text>
                            <Text style={styles.subtitle}>Informações essenciais na palma da mão</Text>
                        </View>

                        <View style={styles.iconContainer}>
                            <BookOpen size={56} color={COLORS.primary} />
                            <View style={styles.iconGlow} />
                        </View>

                        <Text style={styles.cardTitle}>Guia Completo</Text>
                        <Text style={styles.cardDescription}>
                            Acesse o calendário, power packs das redes e todas as informações estratégicas para sua execução.
                        </Text>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleOpenGuide}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Acessar Guia</Text>
                            <ExternalLink size={24} color="#1A1A1A" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </BlurView>
                </ScrollView>
            </Animated.View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Removed fixed width/height to allow flex to fill screen on all devices
    },
    content: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)', // Slightly darker overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    glassCard: {
        width: '100%',
        padding: SPACING.xl,
        borderRadius: RADIUS.xxl,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(20, 20, 20, 0.5)', // Darker glass
        ...SHADOWS.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: SPACING.xs,
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    iconGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        opacity: 0.1,
        zIndex: -1,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    cardDescription: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: SPACING.xxl,
        lineHeight: 24,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary, // Bees Yellow
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        ...SHADOWS.md,
        width: '100%',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    buttonText: {
        color: '#1A1A1A', // Black text
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default GuideScreen;
