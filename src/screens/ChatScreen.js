import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, User, Bot } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { loadSheetData, callGoogleAI } from '../services/aiService';

const ChatScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    const flatListRef = useRef(null);

    useEffect(() => {
        loadData();
        // Initial welcome message
        setMessages([{
            id: '0',
            text: 'Olá! Sou o assistente Raio-X Score 5. Como posso ajudar você hoje?',
            sender: 'bot',
            timestamp: new Date(),
        }]);
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

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);
        setIsTyping(true);

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

            // O Backend agora gera o contexto. Nós mandamos apenas a mensagem e o EG.
            // Se estabelecimento for null, enviamos null (ou seja, perguntas genéricas).
            const egCode = estabelecimento ? estabelecimento.eg : null;

            const aiResponse = await callGoogleAI(userMessage.text, egCode);

            const botMessage = {
                id: Date.now().toString() + '_bot',
                text: aiResponse.resposta || "Sem resposta.",
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

    // Componente Visual do Card
    const AnalysisCard = ({ data }) => {
        if (!data) return null;

        const isSuccess = data.share.status === 'success';
        const isDanger = data.share.status === 'danger';
        const statusColor = isSuccess ? COLORS.success : (isDanger ? COLORS.error : COLORS.warning);
        const statusIcon = isSuccess ? "🚀" : (isDanger ? "📉" : "➖");

        return (
            <View style={styles.cardContainer}>
                {/* Cabeçalho do Card */}
                <View style={[styles.cardHeader, { borderLeftColor: statusColor }]}>
                    <Text style={styles.cardTitle}>{data.title}</Text>
                    <Text style={styles.cardSubtitle}>{data.subtitle}</Text>
                </View>

                {/* Seção de Share */}
                <View style={styles.cardSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={styles.cardLabel}>Share Atual</Text>
                            <Text style={[styles.cardBigNumber, { color: statusColor }]}>{data.share.current}%</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardLabel}>Anterior</Text>
                            <Text style={styles.cardValue}>{data.share.previous}%</Text>
                        </View>
                    </View>

                    {/* Barra de Progresso Visual */}
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(data.share.current, 100)}%`, backgroundColor: statusColor }]} />
                    </View>
                    <Text style={[styles.cardDelta, { color: statusColor }]}>
                        {statusIcon} {isSuccess ? "+" : ""}{data.share.delta}% ({data.share.status === 'neutral' ? 'Estável' : (isSuccess ? 'Crescimento' : 'Queda')})
                    </Text>
                </View>

                {/* Checklist de Itens */}
                <View style={styles.cardSection}>
                    <Text style={styles.cardSectionTitle}>📋 Gaps de Execução:</Text>
                    {data.gaps.length === 0 ? (
                        <Text style={styles.successText}>✅ Loja Perfeita! Nenhum gap.</Text>
                    ) : (
                        data.gaps.map((gap, i) => (
                            <View key={i} style={styles.gapItem}>
                                <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>❌ Faltando:</Text>
                                <Text style={{ marginLeft: 5, color: COLORS.textSecondary }}>{gap}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Insight do Especialista */}
                <View style={[styles.insightBox, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                    <Text style={[styles.insightText, { color: COLORS.textPrimary }]}>💡 {data.insight}</Text>
                </View>

                {/* Dados Extras (Atendimento/Visita) */}
                {data.extra && (
                    <View style={styles.extraInfoContainer}>
                        <View style={styles.extraItem}>
                            <Text style={styles.extraLabel}>📞 Atendimento</Text>
                            <Text style={styles.extraValue}>{data.extra.atendimento}</Text>
                        </View>
                        <View style={styles.extraItem}>
                            <Text style={styles.extraLabel}>🗓️ Visita Quinzenal</Text>
                            <Text style={styles.extraValue}>{data.extra.visita_quinzenal}</Text>
                        </View>
                    </View>
                )}

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
                            if (line.trim().startsWith('-')) {
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

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.botMessageContainer
            ]}>
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
                            {renderFormattedText(item.text, isUser)}
                        </View>
                    )}
                </View>

                {isUser && (
                    <View style={[styles.avatarContainer, { backgroundColor: COLORS.primary }]}>
                        <User size={20} color="#1A1A1A" />
                    </View>
                )}
            </View>
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
                    <Text style={styles.headerTitle}>Raio-X Score 5</Text>
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

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {isTyping && (
                <View style={styles.typingContainer}>
                    <Text style={styles.typingText}>IA está digitando...</Text>
                </View>
            )}

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
                            onPress={handleSend}
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
        padding: SPACING.sm,
        paddingLeft: SPACING.xl,
    },
    typingText: {
        fontSize: 12,
        color: COLORS.textTertiary,
        fontStyle: 'italic',
    },
    inputWrapper: {
        padding: SPACING.md,
        paddingBottom: SPACING.md + 80, // Add extra padding to clear the absolute Tab Bar
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
    }
});

export default ChatScreen;

