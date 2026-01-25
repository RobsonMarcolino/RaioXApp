import React from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Store, BookOpen, Home } from 'lucide-react-native';

import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DataScreen from '../screens/DataScreen';
import GuideScreen from '../screens/GuideScreen';
import { COLORS } from '../constants/theme';
import { useChat } from '../context/ChatContext';
import ChatOverlay from '../components/ChatOverlay';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const { openChat } = useChat();

    return (
        <>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        position: 'absolute',
                        bottom: 25,
                        left: 20,
                        right: 20,
                        borderRadius: 35,
                        height: 70,
                        backgroundColor: 'transparent',
                        elevation: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 5 },
                        shadowOpacity: 0.3,
                        shadowRadius: 5,
                        borderTopWidth: 0,
                        paddingBottom: 0,
                        paddingTop: 0,
                        zIndex: 100,
                    },
                    tabBarBackground: () => (
                        <LinearGradient
                            colors={['#2A2A2A', '#000000']}
                            style={{ flex: 1, borderRadius: 35 }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    ),
                    tabBarActiveTintColor: COLORS.primary,
                    tabBarInactiveTintColor: '#666666',
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        tabBarLabel: 'Início',
                        tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                    }}
                />
                <Tab.Screen
                    name="Chat"
                    component={View} // Placeholder component since we prevent navigation
                    listeners={() => ({
                        tabPress: (e) => {
                            // Prevent default action
                            e.preventDefault();
                            // Open the Chat Overlay
                            openChat();
                        },
                    })}
                    options={{
                        tabBarLabel: 'Chat',
                        tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />
                    }}
                />
                <Tab.Screen
                    name="Lojas"
                    component={DataScreen}
                    options={{
                        tabBarLabel: 'Lojas',
                        tabBarIcon: ({ color, size }) => <Store color={color} size={size} />
                    }}
                />
                <Tab.Screen
                    name="Guia"
                    component={GuideScreen}
                    options={{
                        tabBarLabel: 'Guia',
                        tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />
                    }}
                />
            </Tab.Navigator>
            <ChatOverlay />
        </>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Loading"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right', // Default professional slide
                    animationDuration: 400,
                }}
            >
                <Stack.Screen
                    name="Loading"
                    component={LoadingScreen}
                    options={{ animation: 'none' }}
                />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ animation: 'fade' }} // Smooth fade from loading
                />
                <Stack.Screen name="Lojas" component={DataScreen} />
                <Stack.Screen
                    name="Guia"
                    component={GuideScreen}
                    options={{
                        animation: 'fade', // Use fade to let the internal scale animation take spotlight
                        presentation: 'transparentModal', // Optional: makes it feel more like an overlay/expansion
                    }}
                />
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
