import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Store, BookOpen } from 'lucide-react-native';

import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DataScreen from '../screens/DataScreen';
import GuideScreen from '../screens/GuideScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    height: 60 + (Platform.OS === 'ios' ? 20 : 0),
                    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                    paddingTop: 8,
                    backgroundColor: 'transparent', // Important for gradient to show
                    position: 'absolute', // Needed for transparency to work in some cases, or just to ensure background shows
                    left: 0,
                    right: 0,
                    bottom: 0,
                },
                tabBarBackground: () => (
                    <LinearGradient
                        colors={['#2A2A2A', '#000000']} // Gradient from Dark Gray to Black
                        style={{ flex: 1 }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                ),
                tabBarActiveTintColor: COLORS.primary, // Bees Yellow
                tabBarInactiveTintColor: '#666666', // Dark Gray
            }}
        >
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
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
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
