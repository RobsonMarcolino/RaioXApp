import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Search, X, Store, MapPin, TrendingUp, LayoutGrid, Award, Briefcase, User, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { loadSheetData } from '../services/aiService';
import SkeletonCard from '../components/SkeletonCard';

// Bees Brand Colors
const BEES_YELLOW = '#FCD535';
const BEES_BLACK = '#1A1A1A';
const BEES_WHITE = '#FFFFFF';

const INFO_ICON = require('../../assets/icon.png');
const HEADER_LOGO = require('../../assets/lojas_score5.png'); // Updated based on assets
const DEFAULT_IMAGE = require('../../assets/icon.png');

// Helper to normalize strings for mapping
const normalizeString = (str) => {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "_");
};

// Map of network names to their logo assets
const NETWORK_ASSETS = {
    'abc': require('../../assets/abc.jpg'),
    'epa': require('../../assets/Epa.png'),
    'mart_minas': require('../../assets/MartMinas.png'),
    'super_bh': require('../../assets/superBH.jpg'),
    'bahamas': require('../../assets/Bahamas.jpg'),
    'bernardao': require('../../assets/Bernardao.jpg'),
    'coelho_diniz': require('../../assets/CoelhoDiniz.jpg'),
    'super_nosso': require('../../assets/SuperNosso.jpg'),
    'verdemar': require('../../assets/Verdemar.jpg'),
    'villefort': require('../../assets/Villefort.jpg'),
    'atacadao': require('../../assets/atacadao.jpg'),
    'big_mais': require('../../assets/bigmais.png'),
    'carrefour': require('../../assets/carrefour.png'),
    'rena': require('../../assets/rena.jpg'),
    'sendas': require('../../assets/sendas.jpg'),
    'assai': require('../../assets/sendas.jpg'),
};

const AnimatedItem = ({ index, children }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(50)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
                delay: index * 50, // Reduced delay for smoother list load
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
                delay: index * 50,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            {children}
        </Animated.View>
    );
};

const DataScreen = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRede, setSelectedRede] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Artificial delay for effect
            await new Promise(resolve => setTimeout(resolve, 1500));
            const sheetData = await loadSheetData();
            setData(sheetData);
            setFilteredData(sheetData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Extract unique networks (Redes)
    // Note: 'rede' is now populated from 'GC' column in aiService
    const uniqueRedes = useMemo(() => {
        const redes = [...new Set(data.map(item => item.rede).filter(r => r && r !== 'Outros'))];
        return redes.sort();
    }, [data]);

    const handleSearch = (text) => {
        setSearch(text);
        if (!text) {
            setFilteredData(selectedRede ? data.filter(item => item.rede === selectedRede) : data);
            return;
        }
        const lower = text.toLowerCase();
        // Base data depends on if a Rede is selected
        const baseData = selectedRede ? data.filter(item => item.rede === selectedRede) : data;

        const filtered = baseData.filter(item =>
            (item.chave_pdv && item.chave_pdv.toString().toLowerCase().includes(lower)) ||
            (item.nome_pdv && item.nome_pdv.toLowerCase().includes(lower)) ||
            (item.rede && item.rede.toLowerCase().includes(lower))
        );
        setFilteredData(filtered);
    };

    const handleSelectRede = (rede) => {
        console.log("👉 User selected Rede:", rede);

        if (!rede) return;

        // Force string comparison to be safe
        const filtered = data.filter(item =>
            item.rede &&
            item.rede.toString().toLowerCase() === rede.toString().toLowerCase()
        );

        console.log(`✅ Found ${filtered.length} items for ${rede}`);

        setSelectedRede(rede);
        setSearch('');
        setFilteredData(filtered);
    };

    const handleBackToRedes = () => {
        setSelectedRede(null);
        setSearch('');
        setFilteredData(data);
    };

    const openModal = (item) => {
        setSelectedItem(item);
        setModalVisible(true);
    };

    const renderRedeItem = ({ item }) => {
        const normalizedRede = normalizeString(item);
        const imageSource = NETWORK_ASSETS[normalizedRede] || DEFAULT_IMAGE;

        return (
            <TouchableOpacity
                style={styles.redeCard}
                onPress={() => handleSelectRede(item)}
                activeOpacity={0.8}
            >
                <Image source={imageSource} style={styles.redeImage} resizeMode="cover" />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.redeGradient}
                >
                    <Text style={styles.redeName} numberOfLines={2}>{item}</Text>
                    <View style={styles.redeFooter}>
                        <Text style={styles.redeCount}>
                            {data.filter(d => d.rede === item).length} lojas
                        </Text>
                        <ChevronRight size={16} color="#FFF" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item, index }) => (
        <AnimatedItem index={index}>
            <TouchableOpacity onPress={() => openModal(item)} activeOpacity={0.7}>
                <View style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemEg}>#{item.chave_pdv}</Text>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{item.gn || 'N/A'}</Text>
                        </View>
                    </View>
                    <Text style={styles.itemName}>{item.nome_pdv}</Text>
                    {/* Removed GEO/GC Area line per user request */}
                    <Text style={styles.clickHint}>Ver detalhes</Text>
                </View>
            </TouchableOpacity>
        </AnimatedItem>
    );

    const renderDetailRow = (label, value) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || '-'}</Text>
        </View>
    );

    // Get header image for selected network
    const getHeaderImage = () => {
        if (!selectedRede) return HEADER_LOGO;
        const normalizedRede = normalizeString(selectedRede);
        return NETWORK_ASSETS[normalizedRede] || HEADER_LOGO;
    };

    const headerImage = getHeaderImage();

    return (
        <View style={styles.container}>
            {/* Top Section - Image Header */}
            <View style={styles.topSection}>
                <Image
                    source={headerImage}
                    style={styles.headerImage}
                    resizeMode={selectedRede ? "cover" : "contain"}
                />
            </View>

            {/* Bottom Section - White Sheet */}
            <View style={styles.bottomSection}>
                {/* Sheet Header (Title + Search) */}
                <View style={styles.sheetHeader}>
                    <View style={styles.titleRow}>
                        {selectedRede && (
                            <TouchableOpacity onPress={handleBackToRedes} style={styles.backButton}>
                                <ArrowLeft size={24} color={BEES_BLACK} />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.title}>
                            {selectedRede ? selectedRede : 'Redes Parceiras'}
                        </Text>
                    </View>

                    <View style={styles.searchContainer}>
                        <Search size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={selectedRede ? "Buscar loja..." : "Buscar rede..."}
                            value={search}
                            onChangeText={handleSearch}
                            placeholderTextColor={COLORS.gray400}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch('')}>
                                <X size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Loading Skeletons */}
                {isLoading && (
                    <View style={styles.list}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <SkeletonCard key={i} height={100} style={{ marginBottom: 12 }} />
                        ))}
                    </View>
                )}

                {/* Content List */}
                {!isLoading && (!selectedRede && !search ? (
                    <FlatList
                        key="grid"
                        data={uniqueRedes}
                        renderItem={renderRedeItem}
                        keyExtractor={(item) => item}
                        numColumns={2}
                        contentContainerStyle={styles.gridList}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <FlatList
                        key="list"
                        data={filteredData}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.chave_pdv || index.toString()}
                        contentContainerStyle={styles.list}
                        initialNumToRender={10}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
                            </View>
                        }
                    />
                ))}
            </View>

            {/* Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalhes do PDV</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <X size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                {/* Identificação */}
                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <Store size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Identificação</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('Chave PDV', selectedItem.chave_pdv)}
                                        {renderDetailRow('Nome PDV', selectedItem.nome_pdv)}
                                        {renderDetailRow('GN', selectedItem.gn)}
                                    </View>
                                </View>

                                {/* Performance Cerveja */}
                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <TrendingUp size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Performance Cerveja</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('TT Tendência', selectedItem.cerv_tt_tend)}
                                        {renderDetailRow('TT vs LY', selectedItem.cerv_vs_ly)}
                                        {renderDetailRow('HE Tendência', selectedItem.cerv_he_tend)}
                                        {renderDetailRow('HE vs LY', selectedItem.he_vs_ly)}
                                    </View>
                                </View>

                                {/* Execução */}
                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <LayoutGrid size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Execução</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('KPIs OK', selectedItem.kpis_ok)}
                                        {renderDetailRow('PTs', selectedItem.pts)}
                                        {renderDetailRow('Destaque HE', selectedItem.dtq_he)}
                                    </View>
                                </View>

                                {/* Share */}
                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <Award size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Share</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('Share Espaço', selectedItem.share_espaco)}
                                        {renderDetailRow('Share Gelado', selectedItem.share_gelado)}
                                    </View>
                                </View>

                                {/* Estrutura */}
                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <Briefcase size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Estrutura</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('Sup. Visita', selectedItem.visita_sup)}
                                        {renderDetailRow('Hardware', selectedItem.hardware)}
                                        {renderDetailRow('Promotor', selectedItem.promotor)}
                                        {renderDetailRow('SN', selectedItem.sn)}
                                        {renderDetailRow('SL', selectedItem.sl)}
                                    </View>
                                </View>

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topSection: {
        height: 120, // Reduced height to not take over screen
        width: '100%',
        backgroundColor: BEES_YELLOW,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    bottomSection: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -20,
        overflow: 'hidden',
    },
    sheetHeader: {
        padding: SPACING.lg,
        paddingBottom: SPACING.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    backButton: {
        marginRight: SPACING.sm,
        padding: 4,
    },
    title: {
        fontSize: 24,
        color: BEES_BLACK,
        fontFamily: 'Poppins_700Bold',
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray100,
        borderRadius: RADIUS.md,
        padding: SPACING.sm,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        fontFamily: 'Poppins_400Regular',
        marginLeft: 8,
    },
    list: {
        padding: SPACING.md,
        paddingBottom: 80,
    },
    // GRID STYLES FOR REDES
    gridList: {
        padding: SPACING.md,
        paddingBottom: 80,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    redeCard: {
        width: '48%', // Check this roughly fits 2 columns
        height: 140,
        backgroundColor: '#FFF',
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    redeImage: {
        width: '100%',
        height: '100%',
    },
    redeGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        justifyContent: 'flex-end',
        padding: SPACING.sm,
    },
    redeName: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    redeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    redeCount: {
        color: '#EEE',
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
    },
    // LIST ITEMS (LOJAS)
    itemCard: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        ...SHADOWS.sm,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    itemEg: {
        color: COLORS.primary,
        fontSize: 16,
        fontFamily: 'Poppins_700Bold',
    },
    badgeContainer: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
    },
    badgeText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: 'bold',
    },
    itemName: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
        fontFamily: 'Poppins_600SemiBold',
    },
    clickHint: {
        fontSize: 10,
        color: COLORS.primaryLight,
        marginTop: 4,
        textAlign: 'right',
        fontStyle: 'italic',
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontFamily: 'Poppins_500Medium',
    },
    // MODAL
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.gray50,
        borderTopLeftRadius: RADIUS.xxl,
        borderTopRightRadius: RADIUS.xxl,
        height: '90%',
        padding: SPACING.lg,
        ...SHADOWS.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    modalTitle: {
        fontSize: 22,
        color: COLORS.textPrimary,
        fontFamily: 'Poppins_700Bold',
    },
    closeButton: {
        padding: 8,
        backgroundColor: COLORS.gray200,
        borderRadius: RADIUS.full,
    },
    modalScroll: {
        flex: 1,
    },
    modalSection: {
        marginBottom: SPACING.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: 16,
        color: COLORS.primary,
        marginLeft: SPACING.sm,
        textTransform: 'uppercase',
        fontFamily: 'Poppins_700Bold',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
        fontFamily: 'Poppins_400Regular',
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
        flex: 1,
        textAlign: 'right',
        fontFamily: 'Poppins_600SemiBold',
    },
});

export default DataScreen;
