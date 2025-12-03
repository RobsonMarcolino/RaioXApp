import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { loadSheetData } from '../services/api';
import { Search, X, Store, MapPin, TrendingUp, LayoutGrid, Award, ArrowLeft, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

// Helper to normalize strings (remove accents, lowercase)
const normalizeString = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

// Local assets mapping - keys must be normalized
const NETWORK_ASSETS = {
    'bahamas': require('../../assets/Bahamas.jpg'),
    'bernardao': require('../../assets/Bernardao.jpg'),
    'coelho diniz': require('../../assets/CoelhoDiniz.jpg'),
    'epa': require('../../assets/Epa.png'),
    'mart minas': require('../../assets/MartMinas.png'),
    'super nosso': require('../../assets/SuperNosso.jpg'),
    'verdemar': require('../../assets/Verdemar.jpg'),
    'villefort': require('../../assets/Villefort.jpg'),
    'abc': require('../../assets/abc.jpg'),

    'atacadao': require('../../assets/atacadao.jpg'),
    'big mais': require('../../assets/bigmais.png'),
    'carrefour': require('../../assets/carrefour.png'),
    'rena': require('../../assets/rena.jpg'),
    'sendas': require('../../assets/sendas.jpg'),
    'super bh': require('../../assets/superBH.jpg'),
    'abc alimentos a baixo custo': require('../../assets/abc.jpg'),
    'big mais supermercados': require('../../assets/bigmais.png'),
    'casa rena': require('../../assets/rena.jpg'),
    'atacadao s.a.': require('../../assets/atacadao.jpg'),
};

const DEFAULT_IMAGE = require('../../assets/icon.png');

const DataScreen = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRede, setSelectedRede] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const sheetData = await loadSheetData();
        setData(sheetData);
        setFilteredData(sheetData);
    };

    // Extract unique networks
    const uniqueRedes = useMemo(() => {
        const redes = [...new Set(data.map(item => item.rede).filter(Boolean))];
        return redes.sort();
    }, [data]);

    const handleSearch = (text) => {
        setSearch(text);
        if (!text) {
            setFilteredData(selectedRede ? data.filter(item => item.rede === selectedRede) : data);
            return;
        }
        const lower = text.toLowerCase();
        const baseData = selectedRede ? data.filter(item => item.rede === selectedRede) : data;

        const filtered = baseData.filter(item =>
            (item.eg && item.eg.toLowerCase().includes(lower)) ||
            (item.nome_fantasia && item.nome_fantasia.toLowerCase().includes(lower)) ||
            (!selectedRede && item.rede && item.rede.toLowerCase().includes(lower))
        );
        setFilteredData(filtered);
    };

    const handleSelectRede = (rede) => {
        setSelectedRede(rede);
        setSearch('');
        setFilteredData(data.filter(item => item.rede === rede));
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

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => openModal(item)} activeOpacity={0.7}>
            <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                    <Text style={styles.itemEg}>{item.eg}</Text>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{item.gn || 'N/A'}</Text>
                    </View>
                </View>
                <Text style={styles.itemName}>{item.nome_fantasia}</Text>
                <View style={styles.itemRow}>
                    <MapPin size={14} color={COLORS.textTertiary} />
                    <Text style={styles.itemDetail}>{item.rede}</Text>
                </View>
                <Text style={styles.clickHint}>Ver detalhes</Text>
            </View>
        </TouchableOpacity>
    );

    const renderDetailRow = (label, value) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value || '-'}</Text>
        </View>
    );

    // Get header image for selected network
    const getHeaderImage = () => {
        if (!selectedRede) return null;
        const normalizedRede = normalizeString(selectedRede);
        return NETWORK_ASSETS[normalizedRede];
    };

    const headerImage = getHeaderImage();

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                {headerImage ? (
                    <Image
                        source={headerImage}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                ) : null}

                <LinearGradient
                    colors={headerImage ? ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)'] : [COLORS.primary, COLORS.primaryDark]}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        {selectedRede && (
                            <TouchableOpacity onPress={handleBackToRedes} style={styles.backButton}>
                                <ArrowLeft size={24} color="#FFF" />
                            </TouchableOpacity>
                        )}
                        <Text style={[styles.title, headerImage && styles.titleWithImage]}>
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
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch('')}>
                                <X size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>
            </View>

            {!selectedRede && !search ? (
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
                    keyExtractor={(item, index) => item.eg || index.toString()}
                    contentContainerStyle={styles.list}
                    initialNumToRender={10}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
                        </View>
                    }
                />
            )}

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
                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <Store size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Identificação</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('EG', selectedItem.eg)}
                                        {renderDetailRow('Nome', selectedItem.nome_fantasia)}
                                        {renderDetailRow('Rede', selectedItem.rede)}
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <MapPin size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Estrutura</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('Coordenador', selectedItem.coordenador)}
                                        {renderDetailRow('GN', selectedItem.gn)}
                                        {renderDetailRow('SL/SC', selectedItem.sl_sc)}
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <TrendingUp size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Performance</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('Share de Espaço M-1', selectedItem.share_de_espaco_m1)}
                                        {renderDetailRow('Share de Espaço M0', selectedItem.share_de_espaco_m0)}
                                        {renderDetailRow('Share de Espaço vs M-1', selectedItem.share_de_espaco_vs_m1)}
                                        {renderDetailRow('Share de Gelado M-1', selectedItem.share_de_gelado_m1)}
                                        {renderDetailRow('Share de Gelado M0', selectedItem.share_de_gelado_m0)}
                                        {renderDetailRow('Share de Gelado vs M-1', selectedItem.share_de_gelado_vs_m1)}
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <LayoutGrid size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Execução</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('Gôndola', selectedItem.gondola)}
                                        {renderDetailRow('Ponto Extra', selectedItem.ponto_extra)}
                                        {renderDetailRow('Base Foco', selectedItem.base_foco)}
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <View style={styles.sectionHeader}>
                                        <Award size={20} color={COLORS.primary} />
                                        <Text style={styles.sectionTitle}>Cobertura de HDW</Text>
                                    </View>
                                    <View style={styles.card}>
                                        {renderDetailRow('Corona', selectedItem.corona)}
                                        {renderDetailRow('Spaten', selectedItem.spaten)}
                                        {renderDetailRow('Stella', selectedItem.stella)}
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
        backgroundColor: COLORS.gray50,
    },
    headerWrapper: {
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
        overflow: 'hidden',
    },
    header: {
        padding: SPACING.lg,
        paddingTop: SPACING.xl + 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centered content
        marginBottom: SPACING.md,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 4,
        zIndex: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    titleWithImage: {
        fontSize: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: RADIUS.lg,
        padding: SPACING.sm,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    gridList: {
        padding: SPACING.lg,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    redeCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 0.8,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        ...SHADOWS.md,
    },
    redeImage: {
        width: '100%',
        height: '100%',
    },
    redeGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        justifyContent: 'flex-end',
        padding: SPACING.sm,
    },
    redeName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    redeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    redeCount: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    list: {
        padding: SPACING.md,
    },
    itemCard: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    itemEg: {
        fontWeight: 'bold',
        color: COLORS.primary,
        fontSize: 16,
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
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    itemDetail: {
        fontSize: 12,
        color: COLORS.textTertiary,
        marginLeft: 4,
    },
    clickHint: {
        fontSize: 10,
        color: COLORS.primaryLight,
        marginTop: 4,
        textAlign: 'right',
        fontStyle: 'italic',
    },
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
        fontWeight: 'bold',
        color: COLORS.textPrimary,
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
        fontWeight: 'bold',
        color: COLORS.primary,
        marginLeft: SPACING.sm,
        textTransform: 'uppercase',
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
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',

    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});

export default DataScreen;
