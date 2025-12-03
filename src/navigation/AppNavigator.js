import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessageSquare, Database, BookOpen } from 'lucide-react-native';

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
                    backgroundColor: COLORS.bgCard,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.borderLight,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 5,
                    height: 60 + (Platform.OS === 'ios' ? 20 : 0), // Adjust for safe area
                    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
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
                name="Dados"
                component={DataScreen}
                options={{
                    tabBarLabel: 'Dados',
                    tabBarIcon: ({ color, size }) => <Database color={color} size={size} />
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
