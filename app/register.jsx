import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input, PasswordInput, Button, SocialButton } from '../components/ui/UI';
import { COLORS } from '../constants/theme';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const API_URL = 'http://192.168.1.161:3000';

    const handleRegister = async () => {
        setErrorMessage('');
        setSuccessMessage('');

        if (!username || !email || !password) {
            setErrorMessage('Veuillez remplir tous les champs.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('Compte créé avec succès ! Redirection...');
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            } else {
                setErrorMessage(data.error || 'Erreur serveur');
            }
        } catch (error) {
            setErrorMessage('Impossible de joindre le serveur API.');
        }
    };

    return (
        <LinearGradient colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={{ paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ position: 'absolute', left: 24, top: 48, width: 40, height: 40, backgroundColor: COLORS.overlay, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}
                        >
                            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                        </TouchableOpacity>

                        <Image source={require('../assets/images/logo.png')} style={{ width: 80, height: 80, marginBottom: 16, marginTop: 16 }} resizeMode="contain" />
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>Inscrivez-vous</Text>
                        <Text style={{ color: COLORS.subtext, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 }}>
                            Veuillez vous inscrire pour continuer
                        </Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: COLORS.inputBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, marginHorizontal: 20, marginBottom: 32, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', elevation: 10 }}>
                        <View style={{ gap: 8 }}>
                            <Input
                                label="Nom d'utilisateur"
                                type="text"
                                placeholder="Ton pseudo"
                                value={username}
                                onChangeText={setUsername}
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="exemple@gmail.com"
                                value={email}
                                onChangeText={setEmail}
                            />
                            <PasswordInput
                                label="Mot de passe"
                                placeholder="••••••••••"
                                value={password}
                                onChangeText={setPassword}
                            />
                            <PasswordInput
                                label="Confirmer le mot de passe"
                                placeholder="••••••••••"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />

                            {errorMessage ? (
                                <Text style={{ color: '#FF4C4C', fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: '500' }}>
                                    {errorMessage}
                                </Text>
                            ) : null}

                            {successMessage ? (
                                <Text style={{ color: '#4CAF50', fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: '500' }}>
                                    {successMessage}
                                </Text>
                            ) : null}

                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 16 }}>
                                <Text style={{ color: COLORS.muted, fontSize: 12, marginRight: 4 }}>Vous avez déjà un compte ?</Text>
                                <TouchableOpacity onPress={() => router.push('/login')}>
                                    <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '500' }}>Se connecter</Text>
                                </TouchableOpacity>
                            </View>

                            <Button onPress={handleRegister}>S'inscrire</Button>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 32 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500', marginHorizontal: 16 }}>Ou continuer avec</Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
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