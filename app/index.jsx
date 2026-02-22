import React, { useEffect } from 'react';
import { Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function SplashPage() {
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/login');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient colors={['#C4C6FB', '#7173A6']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image source={require('../assets/images/logo.png')} style={{ width: 112, height: 112, marginBottom: 16 }} resizeMode="contain" />
            <Text style={{ fontSize: 30, fontWeight: 'bold', color: 'black', letterSpacing: 1 }}>OpenMinds</Text>
        </LinearGradient>
    );
}