import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { AppBackground, Button, BottomNav, SettingCard, SettingDropdown } from '../components/ui/UI';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('Compte');

    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [localName, setLocalName] = useState("Chargement...");

    const scrollViewRef = useRef(null);
    const sectionLayouts = useRef({});
    const isTabClick = useRef(false);

    const { user, logout } = useAuth();

    useFocusEffect(
        useCallback(() => {
            const fetchCurrentName = async () => {
                if (user) {
                    const userKey = user.id || user.email;
                    const savedPseudo = await AsyncStorage.getItem(`pseudo_${userKey}`);
                    if (savedPseudo) {
                        setLocalName(savedPseudo);
                    } else {
                        setLocalName(user.userName || user.username || "Non renseigné");
                    }
                }
            };
            fetchCurrentName();
        }, [user])
    );

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/login');
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        if (!editValue.trim()) {
            Alert.alert("Erreur", "Le champ ne peut pas être vide.");
            return;
        }

        if (editingField === "Nom d'affichage (Pseudo)") {
            try {
                if (user) {
                    const userKey = user.id || user.email;
                    await AsyncStorage.setItem(`pseudo_${userKey}`, editValue);
                    setLocalName(editValue);
                    setEditingField(null);
                    Alert.alert("Succès", "Votre pseudo a été mis à jour !");
                }
            } catch (error) {
                Alert.alert("Erreur", "Impossible de sauvegarder le pseudo.");
            }

        } else if (editingField === "Mot de passe") {
            setIsSaving(true);
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await fetch(`${API_URL}/api/users/update`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: editValue })
                });

                if (response.ok) {
                    setEditingField(null);
                    setEditValue("");
                    Alert.alert("Succès", "Votre mot de passe a bien été modifié dans la base de données !");
                } else {
                    Alert.alert("Erreur", "La modification a échoué. Vérifiez votre serveur.");
                }
            } catch (error) {
                Alert.alert("Erreur", "Connexion impossible avec le serveur.");
            } finally {
                setIsSaving(false);
            }
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

    const handleLayout = (section, event) => { sectionLayouts.current[section] = event.nativeEvent.layout.y; };
    const handleScrollBeginDrag = () => { isTabClick.current = false; };

    const handleScroll = (event) => {
        if (isTabClick.current) return;
        const scrollY = event.nativeEvent.contentOffset.y;
        let currentSection = 'Compte';
        if (sectionLayouts.current['Confidentialité'] && scrollY >= sectionLayouts.current['Confidentialité'] - 100) {
            currentSection = 'Confidentialité';
        } else if (sectionLayouts.current['Notification'] && scrollY >= sectionLayouts.current['Notification'] - 100) {
            currentSection = 'Notification';
        }
        if (currentSection !== activeTab) setActiveTab(currentSection);
    };

    return (
        <AppBackground>
            <View style={{ flex: 1, backgroundColor: 'rgba(11, 12, 30, 0.4)', paddingTop: 20 }}>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 24 }}>
                    <TouchableOpacity
                        onPress={editingField ? () => setEditingField(null) : () => router.back()}
                        style={{ width: 44, height: 44, backgroundColor: '#1A1B3A', borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text, flex: 1, textAlign: 'center' }} numberOfLines={1}>
                        {editingField ? `Modifier` : 'Paramètres'}
                    </Text>

                    <View style={{ width: 44 }} />
                </View>

                {editingField ? (
                    <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 10 }}>
                        <Text style={{ color: COLORS.text, fontSize: 14, marginBottom: 8, marginLeft: 16 }}>Nouveau {editingField.toLowerCase()}</Text>
                        <TextInput
                            style={{ backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 50, paddingHorizontal: 24, paddingVertical: 16, fontSize: 14, color: COLORS.text, marginBottom: 24 }}
                            autoCapitalize="none"
                            placeholderTextColor={COLORS.muted}
                            placeholder="Tapez ici..."
                            value={editValue}
                            onChangeText={setEditValue}
                            secureTextEntry={editingField === 'Mot de passe'}
                        />
                        <Button onPress={handleSave} disabled={isSaving}>
                            {isSaving ? "Enregistrement..." : "Enregistrer"}
                        </Button>
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

                        <ScrollView ref={scrollViewRef} style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false} onScroll={handleScroll} onScrollBeginDrag={handleScrollBeginDrag} scrollEventThrottle={16}>
                            <View onLayout={(e) => handleLayout('Compte', e)} style={{ paddingBottom: 24 }}>
                                <Text style={{ color: '#4B5563', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Compte</Text>

                                <SettingCard
                                    title="Nom d'affichage (Pseudo)"
                                    subtitle={localName}
                                    onEdit={() => {
                                        setEditValue(localName !== "Non renseigné" ? localName : "");
                                        setEditingField("Nom d'affichage (Pseudo)");
                                    }}
                                />
                                <SettingCard title="Email (Lié au compte)" subtitle={user?.email || "Non renseigné"} />
                                <SettingCard
                                    title="Mot de passe"
                                    subtitle="********"
                                    onEdit={() => {
                                        setEditValue("");
                                        setEditingField('Mot de passe');
                                    }}
                                />
                                <SettingCard title="Se déconnecter" isLogout={true} onLogout={handleLogout} />
                            </View>

                            <View onLayout={(e) => handleLayout('Notification', e)} style={{ paddingBottom: 24 }}>
                                <Text style={{ color: '#4B5563', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Notification</Text>
                                <SettingDropdown title="Recevoir des notifications" options={['1h avant', '2h avant', 'Désactivé']} initialValue="1h avant" />
                                <SettingDropdown title="Mises à jour automatique" options={['Oui', 'Wifi seulement', 'Non']} initialValue="Auto" />
                                <SettingDropdown title="Rappels par email" options={['Non', 'Oui']} initialValue="Non" />
                            </View>

                            <View onLayout={(e) => handleLayout('Confidentialité', e)} style={{ paddingBottom: 40 }}>
                                <Text style={{ color: '#4B5563', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Confidentialité</Text>
                                <SettingDropdown title="Visibilité du profil" options={['Public', 'Amis', 'Privé']} initialValue="Public" />
                                <SettingDropdown title="Authentification à 2 facteurs" options={['Désactivée', 'App (Google Auth)', 'SMS']} initialValue="Désactivée" />
                                <SettingDropdown title="Utiliser mes données pour améliorer Openminds" options={['Oui', 'Non']} initialValue="Oui" />
                                <SettingCard title="Appareils connectés" subtitle="1 session active" onEdit={() => {}} />
                                <SettingCard title="Comptes bloqués" subtitle="Aucun" onEdit={() => {}} />
                                <SettingCard title="Supprimer mon compte" subtitle="Action irréversible" onEdit={() => {}} />
                            </View>
                        </ScrollView>
                        <BottomNav activeTab="Profile"/>
                    </>
                )}
            </View>
        </AppBackground>
    );
}