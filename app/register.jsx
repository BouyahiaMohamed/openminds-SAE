import React from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input, PasswordInput, Button, SocialButton } from '../components/ui/UI';

export default function RegisterPage() {
    return (
        <LinearGradient colors={['#2D2E5C', '#111226']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ position: 'absolute', left: 24, top: 48, width: 40, height: 40, backgroundColor: 'rgba(11, 12, 30, 0.5)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4B5563' }}
                        >
                            <Ionicons name="chevron-back" size={20} color="white" />
                        </TouchableOpacity>

                        <Image source={require('../assets/images/logo.png')} style={{ width: 80, height: 80, marginBottom: 16, marginTop: 16 }} resizeMode="contain" />
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>Inscrivez-vous</Text>
                        <Text style={{ color: '#D1D5DB', fontSize: 14, textAlign: 'center', paddingHorizontal: 16 }}>
                            Veuillez vous inscrire pour continuer
                        </Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: '#13132C', borderTopLeftRadius: 25, borderTopRightRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, marginHorizontal: 20, marginBottom: 32, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', elevation: 10 }}>
                        <View style={{ gap: 24 }}>
                            <Input label="Email" type="email" placeholder="exemple@gmail.com" />
                            <PasswordInput label="Mot de passe" placeholder="••••••••••" />
                            <PasswordInput label="Confirmer le mot de passe" placeholder="••••••••••" />

                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: -10 }}>
                                <Text style={{ color: '#9CA3AF', fontSize: 12, marginRight: 4 }}>Vous avez déjà un compte ?</Text>
                                <TouchableOpacity onPress={() => router.push('/login')}>
                                    <Text style={{ color: '#6C63FF', fontSize: 12, fontWeight: '500' }}>Se connecter</Text>
                                </TouchableOpacity>
                            </View>

                            <Button onPress={() => console.log('Go to Home')}>S'inscrire</Button>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 32 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
                            <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '500', marginHorizontal: 16 }}>Ou continuer avec</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <SocialButton label="Apple" iconName="logo-apple" />
                            <SocialButton label="Google" iconName="logo-google" />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}