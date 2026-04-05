import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppBackground, BottomNav } from '../../components/ui/UI';
import { API_URL } from '../../config';

const COLORS = {
    background: '#13142b',
    cardBg: '#2A2C4C',
    text: '#ffffff',
    textBlue: '#5C9CE6',
    muted: '#b5b5c3',
    danger: '#C85A5A',
    success: '#7AC17A',
    border: '#41436A'
};

export default function RequestsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const [demandes, setDemandes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDemandes = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');

                const response = await fetch(`${API_URL}/api/admin/certifications-attente`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setDemandes(data);
                } else {
                    console.log("Erreur serveur lors de la récupération.");
                }
            } catch (error) {
                console.error("Erreur réseau :", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDemandes();
    }, []);

    const handleValider = (id_user, nom) => {
        setDemandes(prev => prev.filter(demande => demande.id_user !== id_user));
        Alert.alert("Succès", `La demande de ${nom} a été validée.`);
    };

    const handleRefuser = (id_user, nom) => {
        setDemandes(prev => prev.filter(demande => demande.id_user !== id_user));
        Alert.alert("Refusé", `La demande de ${nom} a été refusée.`);
    };

    return (
        <AppBackground>
            <View style={styles.container}>

                {/* HEADER */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.push('/admin/AdminDashboard')} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Validation Certifications</Text>
                </View>

                {/* RECHERCHE & COMPTEUR */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={COLORS.muted} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher"
                            placeholderTextColor={COLORS.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <Text style={styles.statsText}>{demandes.length} certificats en attente</Text>
                </View>

                {/* FILTRES */}
                <View style={styles.filtersContainer}>
                    <Ionicons name="options-outline" size={24} color={COLORS.muted} />
                    <View style={styles.filterChip}>
                        <Text style={styles.filterChipText}>date d'attente</Text>
                        <Ionicons name="close" size={12} color={COLORS.muted} />
                    </View>
                    <View style={styles.filterChip}>
                        <Text style={styles.filterChipText}>croissant</Text>
                        <Ionicons name="close" size={12} color={COLORS.muted} />
                    </View>
                </View>

                {/* LISTE DES CARTES (VRAIES DONNÉES) */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={COLORS.success} style={{ marginTop: 50 }} />
                    ) : demandes.length === 0 ? (
                        <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 50, fontSize: 16 }}>
                            Aucune demande de certification en attente.
                        </Text>
                    ) : (
                        demandes.map((user) => (
                            <View key={user.id_user} style={styles.card}>

                                <View style={styles.cardTop}>
                                    {/* COLONNE GAUCHE */}
                                    <View style={styles.avatarCol}>
                                        <View style={styles.avatarPlaceholder}>
                                            <Image
                                                source={{ uri: user.avatar }}
                                                style={styles.avatarImage}
                                            />
                                        </View>
                                        <Text style={styles.linkTextProfil}>Profil</Text>
                                        <Text style={styles.actifText}>actif depuis</Text>
                                        <Text style={[styles.boldWhiteTextSmall, { marginTop: 2 }]}>{user.actifDepuis}</Text>
                                    </View>

                                    {/* COLONNE DROITE */}
                                    <View style={styles.infoCol}>

                                        {/* Titre & Date */}
                                        <View style={styles.infoRowTop}>
                                            <Text style={styles.boldWhiteText}>{user.nom} {user.prenom}</Text>
                                            <Text style={styles.boldWhiteTextSmall}>{user.dateAttente}</Text>
                                        </View>

                                        <View style={styles.divider} />

                                        {/* Les vrais chiffres de la BDD ! */}
                                        <View style={styles.statsGrid}>
                                            <View style={styles.statsLeft}>
                                                <Text style={styles.linkText}>{user.formationsInscrites} formations inscrites</Text>
                                                <Text style={styles.linkText}>{user.coursEffectues} cours effectués</Text>
                                            </View>
                                            <View style={styles.statsRight}>
                                                <Text style={styles.boldWhiteTextSmall}>heures totales</Text>
                                                <Text style={[styles.boldWhiteTextSmall, { marginBottom: 10 }]}>{user.heuresTotales}</Text>
                                                <Text style={styles.boldWhiteTextSmall}>{user.absences} absences</Text>
                                            </View>
                                        </View>

                                    </View>
                                </View>

                                {/* BOUTONS D'ACTION */}
                                <View style={styles.cardBottom}>
                                    <TouchableOpacity
                                        style={styles.btnRefuser}
                                        onPress={() => handleRefuser(user.id_user, user.nom)}
                                    >
                                        <Text style={styles.btnText}>Refuser</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.btnValider}
                                        onPress={() => handleValider(user.id_user, user.nom)}
                                    >
                                        <Text style={styles.btnText}>Valider</Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        ))
                    )}
                </ScrollView>

            </View>
            <BottomNav activeTab="Menu" />
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    headerContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30 },
    backBtn: { marginRight: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, letterSpacing: 0.5 },
    searchSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, justifyContent: 'space-between' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderRadius: 20, paddingHorizontal: 15, height: 40, width: '45%', borderWidth: 1, borderColor: COLORS.border },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 13 },
    statsText: { fontSize: 11, color: COLORS.text, fontWeight: 'bold', width: '50%', textAlign: 'right' },
    filtersContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25, gap: 10 },
    filterChip: { flexDirection: 'row', alignItems: 'center', borderColor: COLORS.border, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 5, gap: 6 },
    filterChipText: { color: COLORS.muted, fontSize: 12 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    card: { backgroundColor: COLORS.cardBg, borderRadius: 20, marginBottom: 20, padding: 15 },
    cardTop: { flexDirection: 'row' },
    avatarCol: { alignItems: 'center', width: 90 },
    avatarPlaceholder: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
    avatarImage: { width: 65, height: 65 },
    linkTextProfil: { color: COLORS.textBlue, fontSize: 12, textDecorationLine: 'underline', marginBottom: 10, fontWeight: 'bold' },
    actifText: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' },
    infoCol: { flex: 1, marginLeft: 10 },
    infoRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 5 },
    boldWhiteText: { color: COLORS.text, fontWeight: 'bold', fontSize: 13 },
    boldWhiteTextSmall: { color: COLORS.text, fontWeight: 'bold', fontSize: 12 },
    divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statsLeft: { flex: 1, justifyContent: 'flex-start' },
    statsRight: { flex: 0.8, alignItems: 'flex-end', justifyContent: 'flex-start' },
    linkText: { color: COLORS.textBlue, fontSize: 12, textDecorationLine: 'underline', fontWeight: 'bold', marginBottom: 10 },
    cardBottom: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10, paddingRight: 5 },
    btnRefuser: { backgroundColor: COLORS.danger, paddingVertical: 8, paddingHorizontal: 25, borderRadius: 6 },
    btnValider: { backgroundColor: COLORS.success, paddingVertical: 8, paddingHorizontal: 25, borderRadius: 6 },
    btnText: { color: COLORS.text, fontWeight: 'bold', fontSize: 13 }
});