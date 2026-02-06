import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ImageBackground, Linking, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, User, Bot, BarChart2, Store, FileText, ExternalLink, ChevronLeft } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { loadSheetData, callGoogleAI, generateChatResponse } from '../services/aiService';
import { QUICK_REPLIES, BOT_KNOWLEDGE } from '../data/chatData';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../context/ChatContext';

// Componente de Mensagem Animada
const AnimatedMessage = ({ children, isUser }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                // Align self to ensure animation doesn't stretch container weirdly
                { width: '100%' }
            ]}
        >
            {children}
        </Animated.View>
    );
};

const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot, delay) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                        delay: delay
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true
                    })
                ])
            ).start();
        };

        animate(dot1, 0);
        animate(dot2, 200);
        animate(dot3, 400);
    }, []);

    const dotStyle = (anim) => ({
        opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1]
        }),
        transform: [{
            translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5]
            })
        }]
    });

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
                <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
                <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
            </View>
        </View>
    );
};

const ChatScreen = ({ isOverlay }) => {
    const navigation = useNavigation();
    const { closeChat } = useChat(); // Access context to close overlay
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    const flatListRef = useRef(null);

    useEffect(() => {
        loadData();
        // Initial welcome message REMOVED - We will use Zero State instead
        // or we can keep it if the user wants a history. 
        // User requested "Zero State" implies empty list initially OR specific welcome tailored to zero state.
        // Let's start EMPTY to show the Zero State logic, or check prior messages.
        // For this app, let's start empty to show the "Robô" as requested.
    }, []);

    const loadData = async () => {
        const data = await loadSheetData();
        setCsvData(data);
    };

    const findEstabelecimento = (code) => {
        if (!code || !csvData.length) return null;
        const normalizedCode = code.trim().toUpperCase();

        // Exact match
        let found = csvData.find(est => (est.eg || "").toUpperCase().trim() === normalizedCode);

        // Partial match if not found
        if (!found) {
            found = csvData.find(est => (est.eg || "").toUpperCase().trim().includes(normalizedCode));
        }
        return found;
    };

    const handleReset = () => {
        setMessages([]);
        setInputText('');
    };

    const handleSend = async (textOverride = null) => {
        const textToSend = textOverride || inputText;
        if (!textToSend.trim()) return;

        // Command to reset chat
        if (textToSend.trim().toLowerCase() === 'menu') {
            handleReset();
            return;
        }

        const userMessage = {
            id: Date.now().toString(),
            text: textToSend,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        setIsTyping(true);

        // 1. Check Local Knowledge Base (Instant Response)
        const lowerText = textToSend.trim().toLowerCase();
        let localResponse = null;

        // Check exact match or inclusion for some keywords
        for (const [key, value] of Object.entries(BOT_KNOWLEDGE)) {
            if (lowerText.includes(key)) {
                localResponse = value;
                break;
            }
        }

        if (localResponse) {
            setTimeout(() => {
                const botMessage = {
                    id: Date.now().toString() + '_bot',
                    text: localResponse,
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, botMessage]);
                setIsLoading(false);
                setIsTyping(false);
            }, 800); // Small "fake" delay for realism
            return;
        }

        // 2. If no local match, proceed with normal logic (Google Sheet / AI)
        try {
            // Check if message contains an EG code
            const egPattern = /\d{2,6}-\d/;
            let estabelecimento = null;

            if (egPattern.test(userMessage.text)) {
                estabelecimento = findEstabelecimento(userMessage.text);
                if (!estabelecimento) {
                    const errorMessage = {
                        id: Date.now().toString() + '_err',
                        text: `❌ Código não encontrado na base de dados.\nBase atual: ${csvData.length} estabelecimentos.`,
                        sender: 'bot',
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    setIsLoading(false);
                    setIsTyping(false);
                    return;
                }
            }

            // Use LOCAL response generation for immediate update
            const aiResponse = generateChatResponse(userMessage.text, csvData);

            const botMessage = {
                id: Date.now().toString() + '_bot',
                text: aiResponse.text || "Sem resposta.",
                card: aiResponse.card || null, // Armazena dados do card se houver
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage = {
                id: Date.now().toString() + '_err',
                text: `❌ Erro: ${error.message}`,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
    };

    // Typewriter Component
    const TypewriterText = ({ text, onComplete }) => {
        const [displayedText, setDisplayedText] = useState('');

        useEffect(() => {
            let index = 0;
            const timer = setInterval(() => {
                if (index < text.length) {
                    setDisplayedText((prev) => prev + text.charAt(index));
                    index++;
                } else {
                    clearInterval(timer);
                    if (onComplete) onComplete();
                }
            }, 10); // Adjust speed here (lower is faster)
            return () => clearInterval(timer);
        }, [text]);

        return renderFormattedText(displayedText, false);
    };

    // Componente Visual do Card ATUALIZADO (V2)
    const AnalysisCard = ({ data }) => {
        if (!data) return null;

        // Helper for rows
        const Row = ({ label, value, highlight }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>{label}</Text>
                <Text style={{ color: highlight ? COLORS.primaryDark : COLORS.textPrimary, fontWeight: highlight ? 'bold' : 'normal', fontSize: 13 }}>{value}</Text>
            </View>
        );

        const SectionBox = ({ icon, title, children }) => (
            <View style={styles.cardSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    {icon}
                    <Text style={styles.cardSectionTitle}>{title}</Text>
                </View>
                {children}
            </View>
        );

        return (
            <View style={styles.cardContainer}>
                {/* Cabeçalho */}
                <View style={[styles.cardHeader, { borderLeftColor: COLORS.primary }]}>
                    <Text style={styles.cardTitle}>{data.title}</Text>
                    <Text style={styles.cardSubtitle}>{data.subtitle}</Text>
                </View>

                {/* Métricas Performance */}
                <SectionBox icon={<BarChart2 size={16} color={COLORS.primary} style={{ marginRight: 6 }} />} title="Performance Cerveja">
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.gray600, marginTop: 4, marginBottom: 4 }}>TOTAL (TT)</Text>
                    <Row label="Tendência" value={data.metrics.cerv_tt_tend} highlight />
                    <Row label="Vs LY" value={data.metrics.cerv_vs_ly} />

                    <View style={{ height: 1, backgroundColor: COLORS.gray100, marginVertical: 8 }} />

                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.gray600, marginBottom: 4 }}>HIGH END (HE)</Text>
                    <Row label="Tendência" value={data.metrics.cerv_he_tend} highlight />
                    <Row label="Vs LY" value={data.metrics.he_vs_ly} />
                </SectionBox>

                {/* Market Share */}
                <SectionBox icon={<BarChart2 size={16} color={COLORS.primary} style={{ marginRight: 6 }} />} title="Market Share">
                    <Row label="Share Espaço" value={data.metrics.share_espaco} />
                    <Row label="Share Gelado" value={data.metrics.share_gelado} />
                </SectionBox>

                {/* Execução */}
                <SectionBox icon={<Store size={16} color={COLORS.primary} style={{ marginRight: 6 }} />} title="Execução Global">
                    <Row label="KPIs OK" value={data.metrics.execution?.kpis_ok || data.execution.kpis_ok} />
                    <Row label="Pontos (PTs)" value={data.execute?.pts || data.execution.pts} highlight />
                    <Row label="Destaque HE" value={data.execute?.dtq_he || data.execution.dtq_he} />
                </SectionBox>

                {/* Estrutura */}
                <SectionBox icon={<User size={16} color={COLORS.primary} style={{ marginRight: 6 }} />} title="Estrutura">
                    <Row label="Hardware" value={data.structure.hardware} />
                    <Row label="Promotor" value={data.structure.promotor} />
                    <Row label="Visita Sup." value={data.structure.visita_sup} />
                </SectionBox>

                {/* Insight */}
                <View style={[styles.insightBox, { backgroundColor: COLORS.gray100, borderColor: COLORS.primary }]}>
                    <Text style={[styles.insightText, { color: COLORS.textPrimary }]}>💡 {data.insight}</Text>
                </View>
            </View>
        );
    };

    const renderFormattedText = (text, isUser) => {
        if (isUser) return <Text style={styles.userText}>{text}</Text>;

        const parts = text.split(/(\*\*.*?\*\*)/g); // Split by bold markers

        return (
            <View>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // Bold text
                        return (
                            <Text key={index} style={[styles.botText, { fontWeight: 'bold', color: COLORS.primaryDark }]}>
                                {part.replace(/\*\*/g, '')}
                            </Text>
                        );
                    } else {
                        // Regular text, split by newlines to handle lists
                        const lines = part.split('\n');
                        return lines.map((line, lineIndex) => {
                            if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                                // List item
                                return (
                                    <View key={`${index}-${lineIndex}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 }}>
                                        <Text style={[styles.botText, { marginRight: 6, fontWeight: 'bold', color: COLORS.primaryDark }]}>•</Text>
                                        <Text style={[styles.botText, { flex: 1 }]}>{line.trim().substring(1).trim()}</Text>
                                    </View>
                                );
                            }
                            // Regular line
                            return line ? (
                                <Text key={`${index}-${lineIndex}`} style={[styles.botText, { marginBottom: line.trim() ? 4 : 0 }]}>
                                    {line}
                                </Text>
                            ) : null;
                        });
                    }
                })}
            </View>
        );
    };

    const ZeroState = () => (
        <View style={styles.zeroStateContainer}>
            <View style={styles.zeroStateIconContainer}>
                <Bot size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.zeroStateTitle}>Olá! Sou seu Assistente</Text>
            <Text style={styles.zeroStateSubtitle}>
                Que tal uma análise pra animar?
            </Text>

            <View style={styles.centerChipsContainer}>
                {QUICK_REPLIES.map((reply) => (
                    <TouchableOpacity
                        key={reply.id}
                        style={styles.centerChip}
                        onPress={() => {
                            if (reply.url) {
                                Linking.openURL(reply.url);
                            } else {
                                handleSend(reply.prompt);
                            }
                        }}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.centerChipText}>{reply.text}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const ActionButtons = () => {
        const actions = [
            {
                id: 'verify_eg',
                label: 'Verificar outro EG',
                icon: <BarChart2 size={16} color={COLORS.primary} />,
                actionType: 'chat',
            },
            {
                id: 'request_freezer',
                label: 'Solicitar Freezer',
                icon: <Store size={16} color={COLORS.primary} />, // Using Store as proxy for Freezer/Equipment
                url: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=GUvwznZ3lEq4mzdcd6j5Nhknc28u6bVBruON6FWBAnlUQTdINFpHSjA3R1NERkVPUzdPVTNLQ09TQS4u',
                actionType: 'link',
            },
            {
                id: 'fill_info',
                label: 'Preencher Informações',
                icon: <FileText size={16} color={COLORS.primary} />,
                url: 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=GUvwznZ3lEq4mzdcd6j5Nhknc28u6bVBruON6FWBAnlUQTdINFpHSjA3R1NERkVPUzdPVTNLQ09TQS4u',
                actionType: 'link',
            }
        ];

        const handleAction = async (action) => {
            if (action.actionType === 'chat') {
                const botMessage = {
                    id: Date.now().toString() + '_prompt',
                    text: 'Qual loja vamos analisar agora? (Digite Nome ou EG)',
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, botMessage]);
            } else if (action.url) {
                const supported = await Linking.canOpenURL(action.url);
                if (supported) {
                    await Linking.openURL(action.url);
                } else {
                    alert(`Não foi possível abrir o link: ${action.url}`);
                }
            }
        };

        return (
            <View style={styles.actionButtonsContainer}>
                <Text style={styles.actionTitle}>Ações Recomendadas:</Text>
                <View style={styles.actionsGrid}>
                    {actions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={styles.actionButton}
                            onPress={() => handleAction(action)}
                        >
                            <View style={styles.actionIcon}>
                                {action.icon}
                            </View>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                            {action.actionType === 'link' && (
                                <ExternalLink size={12} color={COLORS.textTertiary} style={{ marginLeft: 'auto' }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderMessage = ({ item, index }) => {
        const isUser = item.sender === 'user';
        // Check if we should show actions: only if it has a card AND status is 'danger' (Queda)
        const showActions = item.card && item.card.share && item.card.share.status === 'danger';

        return (
            <AnimatedMessage isUser={isUser}>
                <View style={[
                    styles.messageContainer,
                    isUser ? styles.userMessageContainer : styles.botMessageContainer,
                    { flexDirection: 'column' } // Changed to column to stack actions below
                ]}>
                    <View style={{ flexDirection: 'row', width: '100%', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                        {!isUser && (
                            <View style={styles.avatarContainer}>
                                <Bot size={20} color={COLORS.primary} />
                            </View>
                        )}
                        <View style={{ maxWidth: '85%' }}>
                            {/* Se tiver Card, mostra O Card. Se não, mostra o balão de texto normal */}
                            {item.card ? (
                                <AnalysisCard data={item.card} />
                            ) : (
                                <View style={[
                                    styles.messageBubble,
                                    isUser ? styles.userBubble : styles.botBubble
                                ]}>
                                    {/* Only use Typewriter for the VERY LAST message if it's from the bot and NOT an error */}
                                    {!isUser && index === messages.length - 1 && !item.id.includes('_err') && !item.isLocal ? (
                                        <TypewriterText text={item.text} />
                                    ) : (
                                        renderFormattedText(item.text, isUser)
                                    )}
                                </View>
                            )}
                        </View>

                        {isUser && (
                            <View style={[styles.avatarContainer, { backgroundColor: COLORS.primary }]}>
                                <User size={20} color="#1A1A1A" />
                            </View>
                        )}
                    </View>

                    {/* Show Action Buttons if condition is met */}
                    {showActions && (
                        <View style={{ paddingLeft: 40, width: '100%' }}>
                            <ActionButtons />
                        </View>
                    )}
                </View>
            </AnimatedMessage>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <ImageBackground
                source={require('../../assets/header.png')}
                style={styles.header}
                resizeMode="cover"
            >
                {/* Overlay for better text readability if needed, or just the content */}
                <View style={styles.headerContent}>
                    {/* Botão de Voltar (esquerda) */}
                    <TouchableOpacity
                        style={{ position: 'absolute', left: 0, padding: 8, zIndex: 20 }}
                        onPress={() => {
                            if (isOverlay) {
                                closeChat();
                            } else {
                                navigation.goBack();
                            }
                        }}
                    >
                        <ChevronLeft size={28} color="#FFF" />
                    </TouchableOpacity>



                    <Text style={styles.headerTitle}>Assistente Virtual</Text>
                    <Text style={styles.headerSubtitle}>
                        {csvData.length > 0 ? `${csvData.length} estabelecimentos` : 'Carregando dados...'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }}
                >
                    <Text style={styles.logoutText}>Sair</Text>
                </TouchableOpacity>
            </ImageBackground>

            {/* Main Content Area */}
            {messages.length === 0 ? (
                <ZeroState />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {isTyping && <TypingIndicator />}

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <View style={styles.inputWrapper}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Digite uma mensagem ou código EG..."
                            placeholderTextColor={COLORS.textTertiary}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            onPress={() => handleSend()}
                            disabled={!inputText.trim() || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#1A1A1A" size="small" />
                            ) : (
                                <Send size={20} color={!inputText.trim() ? "#FFF" : "#1A1A1A"} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Clean Off-white background
    },
    header: {
        flexDirection: 'row',
        padding: SPACING.md,
        paddingTop: SPACING.xl + 20, // Status bar padding
        // backgroundColor removed as it's now an image
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.md,
        zIndex: 10,
        overflow: 'hidden', // Ensure image stays within bounds if rounded
    },
    headerContent: {
        flex: 1,
        alignItems: 'center', // Center text
    },
    headerTitle: {
        fontSize: 20, // Slightly larger
        fontWeight: 'bold',
        color: '#FFF', // White text for better contrast on image
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#FFF', // White text
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoutText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        alignItems: 'flex-end',
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    botMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.sm,
    },
    messageBubble: {
        maxWidth: '100%',
        padding: SPACING.md,
        borderRadius: RADIUS.xl,
        ...SHADOWS.sm,
    },
    userBubble: {
        backgroundColor: COLORS.primary, // Bees Yellow
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    userText: {
        color: '#1A1A1A', // Black text on Yellow
        fontWeight: '500',
    },
    botText: {
        color: '#333',
    },
    typingContainer: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'flex-start', // Align to left like a received message
    },
    typingBubble: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.sm,
        gap: 4
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#666',
    },
    inputWrapper: {
        padding: SPACING.md,
        paddingBottom: SPACING.md, // Removed extra padding since Overlay handles bottom spacing relative to TabBar
        backgroundColor: '#F5F5F5',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        backgroundColor: '#FFF',
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.md,
    },
    input: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: 16,
        color: '#333',
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray400,
    },

    // --- ESTILOS DO NOVO CARD ---
    cardContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 4,
        width: 300, // Largura fixa para ficar bonito
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    cardHeader: {
        borderLeftWidth: 4,
        paddingLeft: 10,
        marginBottom: 12
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#666'
    },
    cardSection: {
        marginBottom: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5'
    },
    cardLabel: {
        fontSize: 12,
        color: '#888',
        textTransform: 'uppercase'
    },
    cardBigNumber: {
        fontSize: 28,
        fontWeight: 'bold'
    },
    cardValue: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600'
    },
    cardDelta: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        marginVertical: 6
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3
    },
    cardSectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6
    },
    gapItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2
    },
    successText: {
        color: COLORS.success,
        fontWeight: 'bold',
        marginTop: 4
    },
    insightBox: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 4
    },
    insightText: {
        fontSize: 13,
        fontStyle: 'italic'
    },
    extraInfoContainer: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 8
    },
    extraItem: {
        alignItems: 'center',
        flex: 1
    },
    extraLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 2
    },
    extraValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#444'
    },
    // --- ESTILOS DOS BOTÕES DE AÇÃO (NOVO) ---
    actionButtonsContainer: {
        marginTop: 8,
        marginBottom: 16,
        maxWidth: 300,
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 4
    },
    actionsGrid: {
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        ...SHADOWS.sm,
    },
    actionIcon: {
        marginRight: 10,
    },
    actionLabel: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    zeroStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    zeroStateIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    zeroStateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary, // Using Brand Color like "Cheguei, Robson!"
        marginBottom: SPACING.xs,
        textAlign: 'center'
    },
    zeroStateSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: SPACING.xl * 2,
    },
    centerChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        maxWidth: '100%',
    },
    centerChip: {
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#EEE',
        ...SHADOWS.sm,
        marginBottom: 8,
    },
    centerChipText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 14,
    }
});

export default ChatScreen;

