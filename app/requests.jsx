import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// NOUVEAUX CHEMINS CORRIGÉS (../../)
import { AppBackground, BottomNav } from '../components/ui/UI';
import { API_URL } from '../config';
// Couleurs extraites de ta maquette
const COLORS = {
    background: '#13142b',
    cardBg: '#2A2C4C', // La couleur exacte des cartes
    text: '#ffffff',
    textBlue: '#5C9CE6', // Bleu des liens (Profil, Formations...)
    muted: '#b5b5c3',
    danger: '#C85A5A', // Rouge doux "Refuser"
    success: '#7AC17A', // Vert doux "Valider"
    border: '#41436A' // Bordure subtile
};

export default function AdminDashboard() {
    const [searchQuery, setSearchQuery] = useState('');

    // On simule 3 cartes pour avoir exactement le même rendu que ton image
    const demandes = [1, 2, 3];

    return (
        <AppBackground>
            <View style={styles.container}>

                {/* 1. HEADER */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Validation Certifications</Text>
                </View>

                {/* 2. RECHERCHE & COMPTEUR */}
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
                    <Text style={styles.statsText}>100 certificats en attente de valider</Text>
                </View>

                {/* 3. FILTRES */}
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

                {/* 4. LISTE DES CARTES */}
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {demandes.map((item, index) => (
                        <View key={index} style={styles.card}>

                            <View style={styles.cardTop}>
                                {/* COLONNE GAUCHE : Avatar & Profil */}
                                <View style={styles.avatarCol}>
                                    <View style={styles.avatarPlaceholder}>
                                        <Image
                                            source={{ uri: `https://i.pravatar.cc/150?img=${10 + index}` }}
                                            style={styles.avatarImage}
                                        />
                                    </View>
                                    <Text style={styles.linkTextProfil}>Profil</Text>
                                    <Text style={styles.actifText}>actif depuis</Text>
                                </View>

                                {/* COLONNE DROITE : Infos & Stats */}
                                <View style={styles.infoCol}>

                                    {/* Titre & Date */}
                                    <View style={styles.infoRowTop}>
                                        <Text style={styles.boldWhiteText}>Nom Prénom</Text>
                                        <Text style={styles.boldWhiteText}>date d'attente</Text>
                                    </View>

                                    {/* Ligne de séparation */}
                                    <View style={styles.divider} />

                                    {/* Grille des stats */}
                                    <View style={styles.statsGrid}>
                                        <View style={styles.statsLeft}>
                                            <Text style={styles.linkText}>100 formations inscrites</Text>
                                            <Text style={styles.linkText}>100 cours effectués</Text>
                                        </View>
                                        <View style={styles.statsRight}>
                                            <Text style={styles.boldWhiteTextSmall}>heures totales</Text>
                                            <Text style={styles.boldWhiteTextSmall}>10 absences</Text>
                                        </View>
                                    </View>

                                </View>
                            </View>

                            {/* BOUTONS D'ACTION */}
                            <View style={styles.cardBottom}>
                                <TouchableOpacity style={styles.btnRefuser}>
                                    <Text style={styles.btnText}>Refuser</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnValider}>
                                    <Text style={styles.btnText}>Valider</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    ))}
                </ScrollView>

            </View>
            <BottomNav activeTab="Menu" />
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },

    // --- Header ---
    headerContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30 },
    backBtn: { marginRight: 10 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, letterSpacing: 0.5 },

    // --- Search Section ---
    searchSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, justifyContent: 'space-between' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderRadius: 20, paddingHorizontal: 15, height: 40, width: '45%', borderWidth: 1, borderColor: COLORS.border },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 13 },
    statsText: { fontSize: 11, color: COLORS.text, fontWeight: 'bold', width: '50%', textAlign: 'right' },

    // --- Filters ---
    filtersContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25, gap: 10 },
    filterChip: { flexDirection: 'row', alignItems: 'center', borderColor: COLORS.border, borderWidth: 1, borderRadius: 15, paddingHorizontal: 12, paddingVertical: 5, gap: 6 },
    filterChipText: { color: COLORS.muted, fontSize: 12 },

    // --- Scroll ---
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

    // --- CARD EXACTE ---
    card: { backgroundColor: COLORS.cardBg, borderRadius: 20, marginBottom: 20, padding: 15 },
    cardTop: { flexDirection: 'row' },

    // Colonne Gauche (Avatar)
    avatarCol: { alignItems: 'center', width: 90 },
    avatarPlaceholder: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
    avatarImage: { width: 65, height: 65 },
    linkTextProfil: { color: COLORS.textBlue, fontSize: 12, textDecorationLine: 'underline', marginBottom: 10, fontWeight: 'bold' },
    actifText: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' },

    // Colonne Droite (Infos)
    infoCol: { flex: 1, marginLeft: 10 },
    infoRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 5 },
    boldWhiteText: { color: COLORS.text, fontWeight: 'bold', fontSize: 13 },
    boldWhiteTextSmall: { color: COLORS.text, fontWeight: 'bold', fontSize: 12, marginBottom: 10 },

    divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },

    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statsLeft: { flex: 1, justifyContent: 'flex-start' },
    statsRight: { flex: 0.8, alignItems: 'flex-end', justifyContent: 'flex-start' },
    linkText: { color: COLORS.textBlue, fontSize: 12, textDecorationLine: 'underline', fontWeight: 'bold', marginBottom: 10 },

    // --- Boutons (Refuser / Valider) ---
    cardBottom: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10, paddingRight: 5 },
    btnRefuser: { backgroundColor: COLORS.danger, paddingVertical: 8, paddingHorizontal: 25, borderRadius: 6 },
    btnValider: { backgroundColor: COLORS.success, paddingVertical: 8, paddingHorizontal: 25, borderRadius: 6 },
    btnText: { color: COLORS.text, fontWeight: 'bold', fontSize: 13 }
});