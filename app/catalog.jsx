import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground, BottomNav } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';

export default function CatalogPage() {
    const [formations, setFormations] = useState([]);
    const [filteredFormations, setFilteredFormations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [likedItems, setLikedItems] = useState({});

    const availableFilters = ['E-Learning', 'Présentiel', 'Développement Perso.', 'Tech & IT', 'Langues', 'Écologie'];

    const normalizeString = (str) => {
        if (!str) return '';
        return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const getDynamicImageUrl = (titre, id) => {
        const cleanTitle = normalizeString(titre);
        let category = "education,study";
        if (/jardin|nature|plante|ecolo|vert|terre/i.test(cleanTitle)) category = "nature,garden,plants";
        else if (/carbone|impact|climat|planete/i.test(cleanTitle)) category = "environment,ecology,earth";
        else if (/prejuges|vivre|discrimination|egalite|social/i.test(cleanTitle)) category = "team,people,cooperation";
        else if (/stress|bienetre|sante|mental|zen/i.test(cleanTitle)) category = "wellness,relax,meditation";
        else if (/russe|langue|etranger|vocabulaire|abc/i.test(cleanTitle)) category = "dictionary,language,books";
        else if (/agile|cyber|digital|code|tech|scrum|informatique/i.test(cleanTitle)) category = "technology,computer,code";
        else if (/management|projet|equipe|leadership/i.test(cleanTitle)) category = "business,office,meeting";
        return `https://loremflickr.com/300/300/${category}?lock=${id}`;
    };

    // 1. Chargement des données au montage
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

                const [resForm, resLikes] = await Promise.all([
                    fetch(`${API_URL}/formations`, { headers }),
                    fetch(`${API_URL}/likes`, { headers })
                ]);

                if (resForm.ok) {
                    const data = await resForm.json();
                    setFormations(data.map(form => {
                        let dateAffichee = "Date à définir";
                        if (form.DateHeure) {
                            const d = new Date(form.DateHeure);
                            const mois = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
                            dateAffichee = `${d.getDate()} ${mois[d.getMonth()]} ${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
                        }
                        return {
                            ...form,
                            isOnline: !!form.isOnline,
                            image: getDynamicImageUrl(form.Titre, form.id),
                            dateLabel: dateAffichee
                        };
                    }));
                }

                if (resLikes.ok) {
                    const likesData = await resLikes.json();
                    const likesMap = {};
                    likesData.forEach(like => likesMap[like.Id_Formation] = true);
                    setLikedItems(likesMap);
                }
            } catch (error) {
                console.error("Erreur:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. Gestion des filtres et recherche
    useEffect(() => {
        let result = formations;
        if (searchQuery) {
            const query = normalizeString(searchQuery);
            result = result.filter(f => normalizeString(f.Titre).includes(query) || (f.Description && normalizeString(f.Description).includes(query)));
        }
        if (activeFilters.length > 0) {
            result = result.filter(item => activeFilters.some(filter => {
                if (filter === 'E-Learning') return item.isOnline;
                if (filter === 'Présentiel') return !item.isOnline;
                const searchArea = normalizeString(item.Titre + " " + (item.Description || ""));
                return searchArea.includes(normalizeString(filter));
            }));
        }
        setFilteredFormations(result);
    }, [searchQuery, activeFilters, formations]);

    const toggleFilter = (filter) => {
        setActiveFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
    };

    const toggleLike = async (id) => {
        const isCurrentlyLiked = likedItems[id];
        setLikedItems(prev => ({ ...prev, [id]: !isCurrentlyLiked }));
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/formations/${id}/like`, {
                method: isCurrentlyLiked ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error();
        } catch (error) {
            setLikedItems(prev => ({ ...prev, [id]: isCurrentlyLiked }));
        }
    };

    return (
        <AppBackground>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Catalogue</Text>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color={COLORS.muted} />
                    <TextInput
                        placeholder="Rechercher une formation..."
                        placeholderTextColor={COLORS.muted}
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.shadowContainer}>
                <View style={styles.mainContainer}>
                    <View style={styles.filtersRow}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableFilters.map(filter => (
                                <TouchableOpacity
                                    key={filter}
                                    onPress={() => toggleFilter(filter)}
                                    style={[styles.filterTag, activeFilters.includes(filter) && styles.filterTagActive]}
                                >
                                    <Text style={[styles.filterTagText, activeFilters.includes(filter) && styles.filterTagTextActive]}>{filter}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                        ) : filteredFormations.length > 0 ? (
                            filteredFormations.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.catalogCard}
                                    onPress={() => router.push({ pathname: '/FormationDetail', params: { id: item.id } })}
                                >
                                    <View style={styles.imageContainer}>
                                        <Image source={{ uri: item.image }} style={styles.cardImage} />
                                        <TouchableOpacity style={styles.heartIcon} onPress={() => toggleLike(item.id)}>
                                            <Ionicons name={likedItems[item.id] ? "heart" : "heart-outline"} size={20} color={likedItems[item.id] ? "#EF4444" : "#FFF"} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.Titre}</Text>
                                        <Text style={styles.cardDesc} numberOfLines={2}>{item.Description || "Apprenez de nouvelles compétences dès aujourd'hui."}</Text>
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.cardType}>{item.isOnline ? "💻 E-Learning" : `📍 ${item.dateLabel}`}</Text>
                                            <Text style={styles.voirPlus}>Détails →</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Aucun résultat trouvé.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>
            <BottomNav activeTab="Catalogue" />
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    settingsBtn: { position: 'absolute', right: 24, top: 60 },
    searchContainer: { paddingHorizontal: 24, paddingBottom: 20 },
    searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 15, paddingHorizontal: 16, height: 50 },
    searchInput: { flex: 1, color: COLORS.text, marginLeft: 10 },
    shadowContainer: { flex: 1, backgroundColor: COLORS.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    mainContainer: { flex: 1, paddingHorizontal: 20 },
    filtersRow: { paddingVertical: 20 },
    filterTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
    filterTagActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterTagText: { color: COLORS.muted, fontSize: 13 },
    filterTagTextActive: { color: COLORS.text, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 100 },
    catalogCard: { flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 20 },
    imageContainer: { width: 80, height: 80, borderRadius: 15, overflow: 'hidden', marginRight: 15 },
    cardImage: { width: '100%', height: '100%' },
    heartIcon: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 4 },
    cardContent: { flex: 1, justifyContent: 'space-between' },
    cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    cardDesc: { color: COLORS.muted, fontSize: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    cardType: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold' },
    voirPlus: { color: COLORS.text, fontSize: 11, opacity: 0.6 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 50 }
});