import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';
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
            const aiResponse = await callGoogleAI(context); // Note: callGoogleAI in api.js expects just the prompt if we modified it, or we need to adjust api.js to accept the full prompt constructed here. 
            // Wait, api.js callGoogleAI takes 'prompt'. generateAIContext returns the full prompt string. So this is correct.

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
                            <Text key={index} style={[styles.botText, { fontWeight: 'bold', color: COLORS.primary }]}>
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
                                        <Text style={[styles.botText, { marginRight: 6, fontWeight: 'bold' }]}>•</Text>
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
                        <User size={20} color="#FFF" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Video
                source={{ uri: 'https://cdn.pixabay.com/video/2024/01/24/198018-906226540_large.mp4' }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                isLooping
                shouldPlay
                isMuted
            />
            <BlurView intensity={90} tint="light" style={styles.blurContainer}>
                <View style={styles.header}>
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
                </View>

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
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Send size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    blurContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        padding: SPACING.md,
        paddingTop: SPACING.xl + 20, // Status bar padding
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primaryDark,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 56, 96, 0.1)',
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 56, 96, 0.3)',
    },
    logoutText: {
        color: COLORS.error,
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
        backgroundColor: COLORS.bgCard,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: SPACING.md,
        borderRadius: RADIUS.xl,
        ...SHADOWS.sm,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: COLORS.bgCard,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: '#FFF',
    },
    botText: {
        color: COLORS.textPrimary,
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
    inputContainer: {
        flexDirection: 'row',
        padding: SPACING.md,
        backgroundColor: COLORS.bgCard,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.gray100,
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginRight: SPACING.sm,
        minHeight: 44,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.md,
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray400,
    },
});

export default ChatScreen;
