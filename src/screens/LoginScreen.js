import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AUTHORIZED_USERS = {
    ambev: "score5@2024",
    direta: "mg@2024",
    admin: "raioX@2024",
    gestor: "offtrade@2024",
};

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleLogin = () => {
        if (!username || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            const normalizedUser = username.toLowerCase().trim();
            if (AUTHORIZED_USERS[normalizedUser] && AUTHORIZED_USERS[normalizedUser] === password) {
                navigation.replace('Welcome');
            } else {
                Alert.alert('Erro', 'Usuário ou senha inválidos');
            }
            setIsLoading(false);
        }, 1500);
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

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <Animated.View style={{ width: '100%', alignItems: 'center', opacity: fadeAnim }}>
                    <BlurView intensity={80} tint="dark" style={styles.loginCard}>
                        <View style={styles.header}>
                            <View style={styles.logo}>
                                <Video
                                    source={{ uri: 'https://cdn.pixabay.com/video/2023/01/09/145864-787701151_tiny.mp4' }}
                                    style={StyleSheet.absoluteFill}
                                    resizeMode="cover"
                                    isLooping
                                    shouldPlay
                                    isMuted
                                />
                            </View>
                            <Text style={styles.title}>Raio-X Score 5</Text>
                            <Text style={styles.subtitle}>Sistema de Inteligência de Dados</Text>
                        </View>

                        <View style={styles.form}>
                            <Text style={styles.label}>Usuário</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Digite seu usuário"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>Senha</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Digite sua senha"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryDark]}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.buttonText}>
                                        {isLoading ? 'Verificando...' : 'Acessar Sistema'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.footer}>
                            Desenvolvido pela <Text style={{ color: COLORS.primaryLight, fontWeight: 'bold' }}>DIRETA MG</Text>
                        </Text>
                    </BlurView>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.gray900,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    loginCard: {
        width: '100%',
        maxWidth: 400,
        padding: SPACING.xl,
        borderRadius: RADIUS.xxl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logo: {
        width: 100,
        height: 100,
        backgroundColor: '#000',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.primary,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textInverse,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray300,
        textAlign: 'center',
    },
    form: {
        gap: SPACING.md,
    },
    label: {
        color: COLORS.textInverse,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        color: COLORS.textInverse,
        fontSize: 16,
    },
    button: {
        marginTop: SPACING.md,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    buttonGradient: {
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    footer: {
        marginTop: SPACING.xl,
        textAlign: 'center',
        color: COLORS.gray400,
        fontSize: 12,
    },
});

export default LoginScreen;
