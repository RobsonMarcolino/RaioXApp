import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, User, Bot } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { loadSheetData, callGoogleAI, generateAIContext } from '../services/api';

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

            const context = generateAIContext(userMessage.text, csvData, estabelecimento);
            const aiResponse = await callGoogleAI(context);

            const botMessage = {
                id: Date.now().toString() + '_bot',
                text: aiResponse,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage = {
                id: Date.now().toString() + '_err',
                text: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
        }
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
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.botBubble
                ]}>
                    {renderFormattedText(item.text, isUser)}
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
            <LinearGradient
                colors={[COLORS.primary, '#E6C229']} // Gradient from Bees Yellow to slightly darker
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={{ flex: 1, alignItems: 'center' }}>
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
            </LinearGradient>

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
        backgroundColor: COLORS.primary, // Bees Yellow
        borderBottomWidth: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.md,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A', // Black text for contrast on Yellow
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#1A1A1A', // Black text
        opacity: 0.7,
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Subtle dark background
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.2)',
    },
    logoutText: {
        color: '#1A1A1A',
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
        maxWidth: '75%',
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
});

export default ChatScreen;
