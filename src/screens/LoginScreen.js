import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { User, Lock, ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const AUTHORIZED_USERS = {
    ambev: "score5@2024",
    direta: "mg@2024",
    admin: "raioX@2024",
    gestor: "offtrade@2024",
};

// Bees Brand Colors
const BEES_YELLOW = '#FCD535';
const BEES_BLACK = '#1A1A1A';
const BEES_WHITE = '#FFFFFF';

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
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
            {/* Top Section - Logo Image */}
            <View style={styles.topSection}>
                <Image
                    source={require('../../assets/LOGO1.jpg')}
                    style={styles.headerImage}
                    resizeMode="cover"
                />
            </View>

            {/* Bottom Section - White Sheet */}
            <Animated.View
                style={[
                    styles.bottomSection,
                    {
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.formContainer}>
                    <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
                    <Text style={styles.welcomeSubtitle}>Insira seus dados para continuar.</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Usuário</Text>
                        <View style={styles.inputWrapper}>
                            <User size={20} color={COLORS.gray500} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Digite seu usuário"
                                placeholderTextColor={COLORS.gray400}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Senha</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color={COLORS.gray500} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Digite sua senha"
                                placeholderTextColor={COLORS.gray400}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
                        </Text>
                        {!isLoading && <ArrowRight size={20} color={BEES_YELLOW} style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Raio-X Score 5 • Versão 1.0</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BEES_YELLOW,
    },
    topSection: {
        height: '35%',
        backgroundColor: BEES_YELLOW,
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    bottomSection: {
        flex: 1,
        backgroundColor: BEES_WHITE,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xxl,
        ...SHADOWS.lg,
    },
    formContainer: {
        width: '100%',
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: BEES_BLACK,
        marginBottom: SPACING.xs,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: COLORS.gray500,
        marginBottom: SPACING.xl,
    },
    inputContainer: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: BEES_BLACK,
        marginBottom: SPACING.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray50,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    inputIcon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        color: BEES_BLACK,
        fontSize: 16,
        height: '100%',
        fontWeight: '500',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: SPACING.xl,
    },
    forgotPasswordText: {
        color: COLORS.gray600,
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        backgroundColor: BEES_BLACK,
        borderRadius: RADIUS.xl,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.md,
    },
    buttonText: {
        color: BEES_YELLOW,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: SPACING.lg,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.gray400,
        fontSize: 12,
        fontWeight: '500',
    },
});

export default LoginScreen;
