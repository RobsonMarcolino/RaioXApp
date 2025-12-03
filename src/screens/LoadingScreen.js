import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoadingScreen = ({ navigation }) => {
    useEffect(() => {
        // Navigate after 3 seconds
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/IniciandoSistema.png')}
                style={styles.image}
                resizeMode="cover"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    image: {
        width: width,
        height: height,
    },
});

export default LoadingScreen;
