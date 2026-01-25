import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ImageBackground, Platform, ScrollView } from 'react-native';
import { BookOpen, ExternalLink } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const GUIDE_URL = "https://www.canva.com/design/DAG56u-5HwE/F5z_aBug3kjsi2pM2j6jRw/edit?utm_content=DAG56u-5HwE&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";

const GuideScreen = () => {
    const insets = useSafeAreaInsets();

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
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        padding: SPACING.lg,
                        paddingTop: insets.top + SPACING.xl,
                        paddingBottom: insets.bottom + SPACING.lg
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Guia de Bolso</Text>
                            <Text style={styles.subtitle}>Informações essenciais na palma da mão</Text>
                        </View>

                        <View style={styles.iconContainer}>
                            <BookOpen size={56} color={COLORS.primary} />
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
                    </View>
                </ScrollView>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A', // Fallback color
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for text readability on bg
    },
    card: {
        width: '100%',
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(26, 26, 26, 0.95)', // Solid dark card almost opaque
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
        borderColor: COLORS.primary, // Highlight border
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
        width: '100%',
        justifyContent: 'center',
        ...SHADOWS.md,
    },
    buttonText: {
        color: '#1A1A1A', // Black text
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});

export default GuideScreen;
