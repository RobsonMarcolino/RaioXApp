import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const MobileContainer = ({ children }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.mobileShell}>
          {children}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0e0e0', // Grey background as a "desktop" backdrop
    alignItems: 'center',
    justifyContent: 'center',
    // On web, we want the container to fill the browser window height
    height: Platform.OS === 'web' ? '100vh' : '100%',
  },
  mobileShell: {
    width: '100%',
    maxWidth: 400, // Approximate large phone width
    height: '100%',
    maxHeight: '100vh', // Ensure it doesn't overflow viewport height unexpectedly
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    // Optional: add border radius if not full screen height, but for "app feel" usually full height is fine.
  },
});

export default MobileContainer;
