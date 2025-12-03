import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ImageBackground, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { BookOpen, ExternalLink } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const GUIDE_URL = "https://www.canva.com/design/DAG56u-5HwE/F5z_aBug3kjsi2pM2j6jRw/edit?utm_content=DAG56u-5HwE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";

const GuideScreen = () => {
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
            <View style={styles.overlay}>
                <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Guia de Bolso</Text>
                        <Text style={styles.subtitle}>Informações essenciais na palma da mão</Text>
                    </View>

                    <View style={styles.iconContainer}>
                        <BookOpen size={48} color={COLORS.primary} />
                    </View>

                    <Text style={styles.cardTitle}>Guia Completo</Text>
                    <Text style={styles.cardDescription}>
                        Acesse o calendário, power packs das redes e todas as informações estratégicas para sua execução.
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={handleOpenGuide}>
                        <Text style={styles.buttonText}>Acessar Guia</Text>
                        <ExternalLink size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </BlurView>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)', // Reduced opacity to show background
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    glassCard: {
        width: '100%',
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(20, 20, 20, 0.3)', // More transparent
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
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    iconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
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
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 24,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        ...SHADOWS.md,
        width: '100%',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default GuideScreen;
