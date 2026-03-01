import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppBackground, Button, BottomNav, SettingCard, SettingDropdown } from '../components/ui/UI';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('Compte');
    const [editingField, setEditingField] = useState(null);
    const scrollViewRef = useRef(null);
    const sectionLayouts = useRef({});
    const isTabClick = useRef(false);

    // On récupère l'utilisateur et la fonction de déconnexion depuis le Context !
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout(); // Supprime le token et vide le context
            router.replace('/login');
        } catch (error) {
            console.error(error);
        }
    };

    const scrollToSection = (section) => {
        isTabClick.current = true;
        setActiveTab(section);
        const y = sectionLayouts.current[section];
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
        }
    };

    const handleLayout = (section, event) => {
        sectionLayouts.current[section] = event.nativeEvent.layout.y;
    };

    const handleScrollBeginDrag = () => {
        isTabClick.current = false;
    };

    const handleScroll = (event) => {
        if (isTabClick.current) return;

        const scrollY = event.nativeEvent.contentOffset.y;
        let currentSection = 'Compte';

        if (sectionLayouts.current['Confidentialité'] && scrollY >= sectionLayouts.current['Confidentialité'] - 100) {
            currentSection = 'Confidentialité';
        } else if (sectionLayouts.current['Notification'] && scrollY >= sectionLayouts.current['Notification'] - 100) {
            currentSection = 'Notification';
        }

        if (currentSection !== activeTab) {
            setActiveTab(currentSection);
        }
    };

    return (
        <AppBackground>
            <View style={{ flex: 1, backgroundColor: 'rgba(11, 12, 30, 0.4)', paddingTop: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 24, position: 'relative' }}>
                    <TouchableOpacity
                        onPress={editingField ? () => setEditingField(null) : () => router.back()}
                        style={{ position: 'absolute', left: 24, top: 36, width: 44, height: 44, backgroundColor: '#1A1B3A', borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.text }}>
                        {editingField ? `Modifier ${editingField}` : 'Paramètres'}
                    </Text>
                </View>

                {editingField ? (
                    <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}>
                        <Text style={{ color: COLORS.text, fontSize: 14, marginBottom: 8, marginLeft: 16 }}>Nouvelle valeur</Text>
                        <TextInput
                            style={{ backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 50, paddingHorizontal: 24, paddingVertical: 16, fontSize: 14, color: COLORS.text, marginBottom: 24 }}
                            autoCapitalize="none"
                            placeholderTextColor={COLORS.muted}
                            placeholder="Tapez ici..."
                        />
                        <Button onPress={() => setEditingField(null)}>Enregistrer</Button>
                    </View>
                ) : (
                    <>
                        <View style={{ flexDirection: 'row', marginHorizontal: 24, marginBottom: 24 }}>
                            {['Compte', 'Notification', 'Confidentialité'].map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => scrollToSection(tab)}
                                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? '#38BDF8' : '#374151' }}
                                >
                                    <Text style={{ color: activeTab === tab ? '#38BDF8' : '#6B7280', fontWeight: 'bold', fontSize: 14 }}>
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView
                            ref={scrollViewRef}
                            style={{ flex: 1, paddingHorizontal: 24 }}
                            showsVerticalScrollIndicator={false}
                            onScroll={handleScroll}
                            onScrollBeginDrag={handleScrollBeginDrag}
                            scrollEventThrottle={16}
                        >
                            <View onLayout={(e) => handleLayout('Compte', e)} style={{ paddingBottom: 24 }}>
                                <Text style={{ color: '#4B5563', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Compte</Text>
                                <SettingCard
                                    title="Nom d'utilisateur"
                                    subtitle={user?.username || "Non renseigné"}
                                    onEdit={() => setEditingField("Nom d'utilisateur")}
                                />
                                <SettingCard
                                    title="Email"
                                    subtitle={user?.email || "Non renseigné"}
                                    onEdit={() => setEditingField('Email')}
                                />
                                <SettingCard
                                    title="Mot de passe"
                                    onEdit={() => setEditingField('Mot de passe')}
                                />
                                <SettingCard
                                    title="Se déconnecter"
                                    isLogout={true}
                                    onLogout={handleLogout}
                                />
                            </View>

                            <View onLayout={(e) => handleLayout('Notification', e)} style={{ paddingBottom: 24 }}>
                                <Text style={{ color: '#4B5563', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Notification</Text>
                                <SettingDropdown
                                    title="Recevoir des notifications"
                                    options={['1h avant', '2h avant', 'Désactivé']}
                                    initialValue="1h avant"
                                />
                                <SettingDropdown
                                    title="Mises à jour automatique"
                                    options={['Oui', 'Wifi seulement', 'Non']}
                                    initialValue="Auto"
                                />
                                <SettingDropdown
                                    title="Rappels par email"
                                    options={['Non', 'Oui']}
                                    initialValue="Non"
                                />
                            </View>

                            <View onLayout={(e) => handleLayout('Confidentialité', e)} style={{ paddingBottom: 40 }}>
                                <Text style={{ color: '#4B5563', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Confidentialité</Text>
                                <SettingDropdown
                                    title="Visibilité du profil"
                                    options={['Public', 'Amis', 'Privé']}
                                    initialValue="Public"
                                />
                                <SettingDropdown
                                    title="Authentification à 2 facteurs"
                                    options={['Désactivée', 'App (Google Auth)', 'SMS']}
                                    initialValue="Désactivée"
                                />
                                <SettingDropdown
                                    title="Utiliser mes données pour améliorer Openminds"
                                    options={['Oui', 'Non']}
                                    initialValue="Oui"
                                />
                                <SettingCard
                                    title="Appareils connectés"
                                    subtitle="1 session active"
                                    onEdit={() => setEditingField('Appareils')}
                                />
                                <SettingCard
                                    title="Comptes bloqués"
                                    subtitle="Aucun"
                                    onEdit={() => setEditingField('Comptes bloqués')}
                                />
                                <SettingCard
                                    title="Supprimer mon compte"
                                    subtitle="Action irréversible"
                                    onEdit={() => setEditingField('Suppression')}
                                />
                            </View>
                        </ScrollView>

                        <BottomNav activeTab="Profile"/>
                    </>
                )}
            </View>
        </AppBackground>
    );
}