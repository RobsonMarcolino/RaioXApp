import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Dimensions } from 'react-native';
import { BookOpen, ExternalLink, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');
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
        <LinearGradient
            colors={['#1A1A1A', '#000000']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
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
                {/* Header Decoration */}
                <View style={styles.headerContainer}>
                    <View style={styles.badge}>
                        <BookOpen size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.badgeText}>DOCUMENTAÇÃO OFICIAL</Text>
                    </View>
                    <Text style={styles.heroTitle}>Guia de Bolso</Text>
                    <Text style={styles.heroSubtitle}>
                        Todas as estratégias e ferramentas para a sua execução perfeita.
                    </Text>
                </View>

                {/* Main Card */}
                <View style={styles.card}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.iconCircle}>
                            <BookOpen size={40} color={COLORS.primary} />
                        </View>

                        <Text style={styles.cardTitle}>Guia Completo 2024</Text>
                        <Text style={styles.cardDescription}>
                            Acesse agora o manual digital com calendário, power packs e diretrizes de execução.
                        </Text>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleOpenGuide}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>ACESSAR MATERIAL</Text>
                            <ExternalLink size={20} color="#1A1A1A" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* Decorative Elements */}
                <View style={styles.footerNote}>
                    <View style={styles.divider} />
                    <Text style={styles.footerText}>Raio-X Score 5 • Excelência em Execução</Text>
                </View>

            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        alignItems: 'flex-start',
        marginBottom: SPACING.xxl,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(252, 213, 53, 0.1)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.full,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(252, 213, 53, 0.2)',
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    heroTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: SPACING.sm,
        letterSpacing: -1,
        lineHeight: 48,
    },
    heroSubtitle: {
        fontSize: 18,
        color: COLORS.gray400,
        lineHeight: 26,
        maxWidth: '90%',
    },
    card: {
        width: '100%',
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1E1E1E',
        ...SHADOWS.lg,
    },
    cardGradient: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(252, 213, 53, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(252, 213, 53, 0.2)',
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
        color: COLORS.gray400,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 24,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#1A1A1A',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footerNote: {
        marginTop: SPACING.xxl,
        alignItems: 'center',
        opacity: 0.5,
    },
    divider: {
        width: 40,
        height: 4,
        backgroundColor: COLORS.gray700,
        borderRadius: 2,
        marginBottom: SPACING.md,
    },
    footerText: {
        color: COLORS.gray500,
        fontSize: 12,
    },
});

export default GuideScreen;
