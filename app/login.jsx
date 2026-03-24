import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input, PasswordInput, Button, SocialButton } from '../components/ui/UI';
import { COLORS } from '../constants/theme';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';


export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { login } = useAuth();

    const handleLogin = async () => {
        setErrorMessage('');

        if (!email || !password) {
            setErrorMessage('Veuillez remplir tous les champs.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                await login(data.user, data.token);
                router.push('/home');
            } else {
                setErrorMessage(data.error || 'Erreur lors de la connexion.');
            }
        } catch (error) {
            setErrorMessage('Impossible de joindre le serveur API.');
        }
    };

    return (
        <LinearGradient colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center' }}>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ position: 'absolute', left: 24, top: 48, width: 40, height: 40, backgroundColor: COLORS.overlay, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}
                    >
                        <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                    </TouchableOpacity>

                    <Image source={require('../assets/images/logo.png')} style={{ width: 80, height: 80, marginBottom: 16, marginTop: 16 }} resizeMode="contain" />
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>Connectez-vous</Text>
                    <Text style={{ color: COLORS.subtext, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 }}>
                        Veuillez saisir vos identifiants pour continuer
                    </Text>
                </View>

                <View style={{ flex: 1, backgroundColor: COLORS.inputBg, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, marginHorizontal: 20, marginBottom: 32, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', elevation: 10 }}>
                    <View style={{ gap: 24 }}>
                        <Input
                            label="Email"
                            type="email"
                            placeholder="exemple@gmail.com"
                            onChangeText={setEmail}
                        />
                        <PasswordInput
                            label="Mot de passe"
                            placeholder="••••••••••"
                            onChangeText={setPassword}
                        />

                        {errorMessage ? (
                            <Text style={{ color: '#FF4C4C', fontSize: 12, textAlign: 'center', marginTop: -10, fontWeight: '500' }}>
                                {errorMessage}
                            </Text>
                        ) : null}

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: -10 }}>
                            <TouchableOpacity>
                                <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '500' }}>Mot de passe oublié</Text>
                            </TouchableOpacity>
                        </View>

                        <Button onPress={handleLogin}>Se connecter</Button>
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

                    <View style={{ marginTop: 'auto', paddingTop: 24, flexDirection: 'row', justifyContent: 'center' }}>
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>Pas de compte ? </Text>
                        <TouchableOpacity onPress={() => router.push('./register')}>
                            <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '500' }}>En créer un</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}