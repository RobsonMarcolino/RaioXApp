import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, Animated, Platform, View } from 'react-native';
import { useChat } from '../context/ChatContext';
import ChatScreen from '../screens/ChatScreen'; // Reusing the existing ChatScreen
import { SHADOWS, RADIUS } from '../constants/theme';

const { height } = Dimensions.get('window');

const ChatOverlay = () => {
    const { isChatOpen } = useChat();
    // Add extra offset (100) to ensure it's fully off-screen even with browser address bars
    const translateY = useRef(new Animated.Value(height + 100)).current;

    useEffect(() => {
        Animated.spring(translateY, {
            toValue: isChatOpen ? 0 : height + 100, // Use same extra offset when closing
            useNativeDriver: Platform.OS !== 'web', // Web supports it but native is better with it
            friction: 8,
            tension: 40,
        }).start();
    }, [isChatOpen]);

    // Optimize rendering: if closed and animation finished (roughly), we could unmount, 
    // but for now keeping it mounted for instant smooth toggle is better. 
    // We can use pointerEvents="none" when closed to prevent touches.

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY }] }
            ]}
            pointerEvents={isChatOpen ? 'auto' : 'none'}
        >
            <View style={styles.sheet}>
                {/* 
                  Passing isOverlay prop to ChatScreen so it knows to behave as an overlay 
                  (e.g., Back button closes overlay instead of navigation.goBack)
                */}
                <ChatScreen isOverlay={true} />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0, // Fill screen
        zIndex: 50, // Below TabBar (usually 100) but above everything else
        justifyContent: 'flex-end', // Align to bottom
    },
    sheet: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        overflow: 'hidden',
        ...SHADOWS.lg,
        paddingBottom: 80, // Add padding for TabBar visibility
    }
});

export default ChatOverlay;
