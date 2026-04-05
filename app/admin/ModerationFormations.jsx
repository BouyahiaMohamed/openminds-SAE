import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppBackground } from '../../components/ui/UI';
import { API_URL } from '../../config';
import { COLORS } from '../../constants/theme';

export default function ModerationFormations() {
    const [pendingFormations, setPendingFormations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const fetchPending = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/admin/formations/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setPendingFormations(await res.json());
            } else {
                const errorData = await res.json();
                console.error("Erreur API:", errorData);
                Alert.alert("Erreur API", errorData.error || "Problème d'accès. As-tu bien mis à jour la BDD ?");
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
            Alert.alert("Erreur", "Impossible de contacter le serveur.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (id, action) => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const method = action === 'accept' ? 'PUT' : 'DELETE';
            const endpoint = `${API_URL}/admin/formations/${id}/${action}`;

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setPendingFormations(prev => prev.filter(f => f.id !== id));
            } else {
                Alert.alert("Erreur", "Une erreur est survenue lors de l'opération.");
            }
        } catch (error) {
            console.error("Erreur action:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFormations = pendingFormations.filter(formation => {
        const titleMatch = formation.Titre?.toLowerCase().includes(searchQuery.toLowerCase());
        const descMatch = formation.Description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSearch = titleMatch || descMatch;

        const matchesType = filterType === 'all' ||
            (filterType === 'online' && formation.isOnline === 1) ||
            (filterType === 'presential' && formation.isOnline === 0);

        return matchesSearch && matchesType;
    });

    return (
        <AppBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modération</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={COLORS.muted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher une formation..."
                        placeholderTextColor={COLORS.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.filterTabs}>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
                        onPress={() => setFilterType('all')}
                    >
                        <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>Toutes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === 'online' && styles.filterTabActive]}
                        onPress={() => setFilterType('online')}
                    >
                        <Text style={[styles.filterTabText, filterType === 'online' && styles.filterTabTextActive]}>En Ligne</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === 'presential' && styles.filterTabActive]}
                        onPress={() => setFilterType('presential')}
                    >
                        <Text style={[styles.filterTabText, filterType === 'presential' && styles.filterTabTextActive]}>Présentiel</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.titleContainer}>
                    <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} style={{marginRight: 10}}/>
                    <Text style={styles.title}>Propositions en attente ({filteredFormations.length})</Text>
                </View>

                {isLoading && pendingFormations.length === 0 ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
                ) : filteredFormations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={60} color={COLORS.muted} />
                        <Text style={styles.emptyText}>Aucun résultat trouvé.</Text>
                        <Text style={styles.emptySubText}>La liste est vide ou les filtres bloquent.</Text>
                    </View>
                ) : (
                    filteredFormations.map(formation => (
                        <View key={formation.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{formation.Titre}</Text>
                            </View>

                            <Text style={styles.cardDesc} numberOfLines={3}>{formation.Description || 'Aucune description fournie.'}</Text>

                            <View style={styles.metaContainer}>
                                <Text style={styles.cardMeta}>
                                    <Ionicons name="calendar-outline" size={14} /> {formation.DateHeure || 'Date non précisée'}
                                </Text>
                                <Text style={[styles.cardMeta, { color: formation.isOnline ? COLORS.primary : '#f59e0b', marginTop: 5 }]}>
                                    <Ionicons name={formation.isOnline ? "laptop-outline" : "location-outline"} size={14} /> {formation.isOnline ? 'E-Learning' : formation.Adresse}
                                </Text>
                            </View>

                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444', borderWidth: 1 }]}
                                    onPress={() => handleAction(formation.id, 'reject')}
                                >
                                    <Ionicons name="close" size={20} color="#EF4444" />
                                    <Text style={[styles.actionText, { color: '#EF4444' }]}>Refuser</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#4ade80' }]}
                                    onPress={() => handleAction(formation.id, 'accept')}
                                >
                                    <Ionicons name="checkmark" size={20} color="#1E1E1E" />
                                    <Text style={[styles.actionText, { color: '#1E1E1E' }]}>Valider & Publier</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8, zIndex: 1 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginLeft: -40 },

    searchContainer: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 15, height: 45, marginBottom: 15 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 15 },

    filterTabs: { flexDirection: 'row', justifyContent: 'space-between' },
    filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    filterTabActive: { borderBottomColor: COLORS.primary },
    filterTabText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
    filterTabTextActive: { color: COLORS.primary, fontWeight: 'bold' },

    container: { padding: 20, paddingBottom: 50 },
    titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginTop: 15 },
    emptySubText: { color: COLORS.muted, fontSize: 14, marginTop: 5 },

    card: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
    cardDesc: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginBottom: 15 },

    metaContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, marginBottom: 20 },
    cardMeta: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

    actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionBtn: { flex: 0.48, flexDirection: 'row', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionText: { fontWeight: 'bold', marginLeft: 8, fontSize: 15 }
});