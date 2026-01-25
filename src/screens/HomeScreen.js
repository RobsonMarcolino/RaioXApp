import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, FlatList, Platform, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Store, BookOpen, TrendingUp, Bell, User, Bot, ExternalLink, ChevronRight, BarChart2, FileText, AlertTriangle } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { loadSheetData } from '../services/aiService';
import { useChat } from '../context/ChatContext';

const RAW_LINKS = [
    {
        id: '1',
        title: 'SSBI OFF TRADE',
        subtitle: 'Relatórios de performance',
        url: 'https://app.powerbi.com/groups/me/apps/00153bdf-1acc-4037-8215-45ebeee65254/reports/e24f51cf-978b-40f9-8218-ff97d8a970a4/02741ce119449f8983f1?ctid=cef04b19-7776-4a94-b89b-375c77a8f936&experience=power-bi&clientSideAuth=0',
        color: '#2A2A2A',
        icon: BarChart2
    },
    {
        id: '2',
        title: 'CATÁLOGO',
        subtitle: 'Portfólio completo',
        url: 'https://www.catalogoambev.com.br/site',
        color: '#2A2A2A',
        icon: FileText
    },
    {
        id: '3',
        title: 'SEGURANÇA',
        subtitle: 'Registre ocorrências',
        url: 'https://forms.office.com/pages/responsepage.aspx?id=GUvwznZ3lEq4mzdcd6j5NnclUI9YNE5An29yZevNda9UMThWMUdBUk9aNTdLVUhXU0RXM0s2RDJFRC4u',
        color: '#2A2A2A',
        icon: AlertTriangle
    }
];

const HomeScreen = ({ navigation }) => {
    const { openChat } = useChat();
    const [storeCount, setStoreCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Responsive Width Calculation
    const { width: windowWidth } = useWindowDimensions();
    // Clamp width on web to match MobileContainer's max width (approx 400-420)
    // MobileContainer uses 400 max width usually. Let's aim for that alignment.
    const containerWidth = Platform.OS === 'web' ? Math.min(windowWidth, 400) : windowWidth;

    // Adjust Card Width to be full width minus padding
    const CONTENT_PADDING = SPACING.lg; // 24
    const CARD_WIDTH = containerWidth - (CONTENT_PADDING * 2);

    const scrollY = useRef(new Animated.Value(0)).current;

    // Header Animation Values
    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -50],
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50, 100],
        outputRange: [1, 0.9, 0],
        extrapolate: 'clamp',
    });

    const flatListRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prevIndex => {
                const nextIndex = prevIndex >= RAW_LINKS.length - 1 ? 0 : prevIndex + 1;
                flatListRef.current?.scrollToOffset({
                    offset: nextIndex * (CARD_WIDTH + SPACING.md),
                    animated: true
                });
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [CARD_WIDTH]);

    const loadData = async () => {
        try {
            const data = await loadSheetData();
            setStoreCount(data.length);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openLink = async (url) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            alert(`Não foi possível abrir o link: ${url}`);
        }
    };

    const renderCard = (title, subtitle, icon, color, onPress, IconComponent) => (
        <TouchableOpacity
            style={[styles.card, styles.cardSmall]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={['#1A1A1A', '#000']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.cardContentWrapper}>
                    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                        {icon}
                    </View>
                    <View>
                        <Text style={styles.cardTitle}>{title}</Text>
                        <Text style={styles.cardSubtitle}>{subtitle}</Text>
                    </View>
                </View>
                {/* Decorative Watermark */}
                <View style={styles.watermarkContainer}>
                    <IconComponent size={80} color="rgba(255,255,255,0.05)" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderBannerItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.bannerCard, { width: CARD_WIDTH }]}
            onPress={() => openLink(item.url)}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={['#FCD535', '#F4B400']} // Ambev Yellow Gradient
                style={styles.bannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={styles.bannerContent}>
                    <View style={styles.bannerIconContainer}>
                        <item.icon size={20} color="#1A1A1A" />
                    </View>
                    <View style={styles.bannerTextContainer}>
                        <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.bannerSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.bannerButton}>
                        <ExternalLink size={16} color="#1A1A1A" />
                    </View>
                </View>
                <View style={styles.bannerDecoration} />
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <Animated.View style={[
                styles.headerWrapper,
                {
                    transform: [{ translateY: headerTranslateY }],
                    opacity: headerOpacity,
                    zIndex: 10
                }
            ]}>
                <LinearGradient
                    colors={['#FCD535', '#F4B400']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    <Image
                        source={require('../../assets/header_pattern.png')}
                        style={styles.headerPattern}
                        resizeMode="cover"
                    />
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greetingText}>Olá,</Text>
                            <Text style={styles.userName}>AMBEVER</Text>
                            <Text style={styles.userSubtitle}>Off trade Mg</Text>
                        </View>
                        <TouchableOpacity style={styles.profileButton}>
                            <Bot size={28} color="#1A1A1A" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </Animated.View>

            <Animated.ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: Platform.OS !== 'web' } // Web doesn't fully support layout animation driver
                )}
                scrollEventThrottle={16}
            >
                {/* Main Action - AI Chat */}
                <TouchableOpacity
                    style={styles.mainCard}
                    onPress={openChat}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#1A1A1A', '#000']}
                        style={styles.mainCardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.mainCardContent}>
                            <View style={styles.mainIconBadge}>
                                <MessageSquare size={32} color={COLORS.primary} />
                            </View>
                            <Text style={styles.mainCardTitle}>Assistente IA</Text>
                            <Text style={styles.mainCardSubtitle}>
                                Tire dúvidas e analise dados em tempo real.
                            </Text>
                            <View style={styles.actionButton}>
                                <Text style={styles.actionButtonText}>Iniciar Conversa</Text>
                            </View>
                        </View>
                        <View style={styles.mainWatermarkContainer}>
                            <Bot size={180} color="rgba(252, 213, 53, 0.1)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Grid Section */}
                <Text style={styles.sectionTitle}>Visão Geral</Text>
                <View style={styles.gridContainer}>
                    {renderCard(
                        'Lojas',
                        `${storeCount} Cadastradas`,
                        <Store size={24} color={COLORS.primary} />,
                        COLORS.primary,
                        () => navigation.navigate('Lojas'),
                        Store
                    )}
                    {renderCard(
                        'Guia de Bolso',
                        'Acesse o manual',
                        <BookOpen size={24} color="#4CAF50" />,
                        '#4CAF50',
                        () => navigation.navigate('Guia'),
                        BookOpen
                    )}
                </View>

                {/* Banner Carousel */}
                <Text style={styles.sectionTitle}>Links Rápidos</Text>
                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={RAW_LINKS}
                        renderItem={renderBannerItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH + SPACING.md}
                        decelerationRate="fast"
                        snapToAlignment="start"
                        contentContainerStyle={{
                            paddingHorizontal: SPACING.lg,
                        }}
                        ItemSeparatorComponent={() => <View style={{ width: SPACING.md }} />}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + SPACING.md));
                            setCurrentIndex(index);
                        }}
                    />
                    {/* Pagination Dots */}
                    <View style={styles.paginationContainer}>
                        {RAW_LINKS.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    index === currentIndex && styles.paginationDotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        paddingTop: SPACING.xl + 30,
        paddingBottom: SPACING.xl,
        paddingHorizontal: SPACING.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...SHADOWS.md,
        overflow: 'hidden', // Ensure pattern stays inside
    },
    headerPattern: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.15,
        zIndex: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1, // Ensure content is above pattern
    },
    greetingText: {
        fontSize: 18,
        color: '#1A1A1A',
        fontWeight: '500',
        marginBottom: -4,
    },
    userName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1A1A1A',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    userSubtitle: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    profileButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
    },
    actionButtonText: {
        color: '#1A1A1A',
        fontWeight: 'bold',
        fontSize: 12,
    },
    mainWatermarkContainer: {
        position: 'absolute',
        right: -40,
        bottom: -40,
        opacity: 1,
        zIndex: 1,
    },
    cardContentWrapper: {
        zIndex: 2,
        justifyContent: 'space-between',
        height: '100%',
    },
    watermarkContainer: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        opacity: 1,
        transform: [{ rotate: '-15deg' }],
        zIndex: 1,
    },
    carouselContainer: {
        marginBottom: SPACING.xl,
        marginHorizontal: -SPACING.lg, // Negate parent padding to allow full-width swipe
    },
    bannerCard: {
        height: 100, // Reduced height
        borderRadius: RADIUS.lg,
        ...SHADOWS.sm,
        overflow: 'hidden',
    },
    bannerGradient: {
        flex: 1,
        padding: SPACING.md,
        justifyContent: 'center',
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    bannerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(26, 26, 26, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    bannerTextContainer: {
        flex: 1,
        marginRight: SPACING.md,
    },
    bannerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    bannerSubtitle: {
        fontSize: 12,
        color: '#333',
    },
    bannerButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerDecoration: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        zIndex: 1,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.md,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 100,
        paddingTop: 180, // Push content down to accommodate the absolute header
    },
    headerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    mainCard: {
        height: 180,
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.xl,
        ...SHADOWS.md,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    mainCardGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainCardContent: {
        flex: 1,
        padding: SPACING.lg,
        zIndex: 2,
    },
    mainIconBadge: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: 'rgba(252, 213, 53, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    mainCardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    mainCardSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: RADIUS.full,
        alignSelf: 'flex-start',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: SPACING.md,
    },
    gridContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
        gap: SPACING.md, // Ensure gap between grid items
    },
    card: {
        borderRadius: RADIUS.lg,
        ...SHADOWS.sm,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardSmall: {
        flex: 1, // Use flex 1 to fill available space equally
        height: 140,
    },
    cardLarge: {
        width: '100%',
        height: 140,
    },
    cardGradient: {
        flex: 1,
        padding: SPACING.md,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: SPACING.sm,
    },
    cardSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});

export default HomeScreen;
