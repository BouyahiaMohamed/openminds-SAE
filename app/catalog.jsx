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

    // 👉 NOUVEAU : Des filtres vraiment utiles et professionnels
    const availableFilters = ['E-Learning', 'Présentiel', 'Développement Perso.', 'Tech & IT', 'Langues', 'Écologie'];

    const [isLoading, setIsLoading] = useState(true);
    const [likedItems, setLikedItems] = useState({});

    const normalizeString = (str) => {
        if (!str) return '';
        return str
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    // 👉 NOUVEAU : Variété garantie à 100% avec le paramètre "lock"
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

        // Le paramètre lock=${id} force le service à générer une image unique pour chaque cours, même avec la même catégorie !
        return `https://loremflickr.com/300/300/${category}?lock=${id}`;
    };

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await fetch(`${API_URL}/formations`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    const formattedData = data.map(form => {
                        let dateAffichee = "";
                        if (form.DateHeure) {
                            const d = new Date(form.DateHeure);
                            const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
                            const minutes = d.getMinutes() === 0 ? '' : d.getMinutes();
                            dateAffichee = `${d.getDate()} ${mois[d.getMonth()]} ${d.getHours()}h${minutes}`;
                        }

                        return {
                            ...form,
                            isOnline: !!form.isOnline,
                            image: getDynamicImageUrl(form.Titre, form.id),
                            DateHeure: dateAffichee
                        };
                    });

                    setFormations(formattedData);
                }
            } catch (error) {
                console.error("Erreur de récupération du catalogue:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCatalog();
    }, []);

    // 👉 NOUVEAU : Moteur de filtres intelligent par thématiques
    useEffect(() => {
        let result = formations;

        // 1. Recherche par texte
        if (searchQuery) {
            const query = normalizeString(searchQuery);
            result = result.filter(f => {
                const titleMatch = normalizeString(f.Titre).includes(query);
                const descMatch = f.Description && normalizeString(f.Description).includes(query);
                return titleMatch || descMatch;
            });
        }

        // 2. Filtres par tags "intelligents"
        if (activeFilters.length > 0) {
            result = result.filter(item => {
                return activeFilters.some(filter => {
                    if (filter === 'E-Learning') return item.isOnline === true;
                    if (filter === 'Présentiel') return item.isOnline === false;

                    const textToSearch = normalizeString(item.Titre) + " " + (item.Description ? normalizeString(item.Description) : "");

                    if (filter === 'Tech & IT') return /agile|cyber|digital|code|tech|scrum|informatique/i.test(textToSearch);
                    if (filter === 'Langues') return /russe|langue|anglais|espagnol|vocabulaire/i.test(textToSearch);
                    if (filter === 'Écologie') return /nature|jardin|plante|ecolo|vert|terre|carbone|climat/i.test(textToSearch);
                    if (filter === 'Développement Perso.') return /stress|prejuges|vivre|communication|bienetre|management|equipe/i.test(textToSearch);

                    return textToSearch.includes(normalizeString(filter));
                });
            });
        }

        setFilteredFormations(result);
    }, [searchQuery, activeFilters, formations]);

    const toggleFilter = (filter) => {
        setActiveFilters(prev => {
            if (prev.includes(filter)) return prev.filter(f => f !== filter);
            return [...prev, filter];
        });
    };

    const toggleLike = (id) => {
        setLikedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <AppBackground>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Formations</Text>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color={COLORS.muted} />
                    <TextInput
                        placeholder="Rechercher"
                        placeholderTextColor={COLORS.muted}
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.dateInputWrapper}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.muted} />
                    <Text style={styles.dateText}>Date</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.shadowContainer}>
                <View style={styles.mainContainer}>
                    <View style={styles.filtersRow}>
                        {/* 👉 RETOUR de "options-outline" à la place de "tune-outline" */}
                        <Ionicons name="options-outline" size={24} color={COLORS.muted} style={{ marginRight: 12 }} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {availableFilters.map(filter => (
                                <TouchableOpacity
                                    key={filter}
                                    onPress={() => toggleFilter(filter)}
                                    style={[
                                        styles.filterTag,
                                        activeFilters.includes(filter) && styles.filterTagActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.filterTagText,
                                        activeFilters.includes(filter) && styles.filterTagTextActive
                                    ]}>{filter}</Text>
                                    <Ionicons
                                        name={activeFilters.includes(filter) ? "close" : "add"}
                                        size={14}
                                        color={activeFilters.includes(filter) ? COLORS.text : COLORS.muted}
                                        style={{ marginLeft: 4 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                        ) : filteredFormations.length > 0 ? (
                            filteredFormations.map((item) => (
                                <TouchableOpacity key={item.id} style={styles.catalogCard}>
                                    <View style={styles.imageContainer}>
                                        <Image source={{ uri: item.image }} style={styles.cardImage} />

                                        <TouchableOpacity
                                            style={styles.heartIcon}
                                            onPress={() => toggleLike(item.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={likedItems[item.id] ? "heart" : "heart-outline"}
                                                size={22}
                                                color={likedItems[item.id] ? "#EF4444" : COLORS.text}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{item.Titre}</Text>
                                        <Text style={styles.cardDesc} numberOfLines={2}>
                                            {item.Description || "Aucune description disponible."}
                                        </Text>

                                        <View style={styles.cardFooter}>
                                            <Text style={styles.cardType}>
                                                {item.isOnline ? "E-Learning" : (item.DateHeure || "Date à définir")}
                                            </Text>
                                            <View style={styles.voirPlusContainer}>
                                                {item.isOnline ? <Ionicons name="download-outline" size={20} color={COLORS.text} /> : null}
                                                <Text style={styles.voirPlus}>Voir plus...</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Aucune formation ne correspond à vos critères.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>

            <BottomNav activeTab="Catalogue" />
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, position: 'relative' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    settingsBtn: { position: 'absolute', right: 24, top: 60 },

    searchContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 20, gap: 12 },
    searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: COLORS.border },
    searchInput: { flex: 1, color: COLORS.text, marginLeft: 8, fontSize: 14 },
    dateInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 25, height: 44, borderWidth: 1, borderColor: COLORS.border },
    dateText: { color: COLORS.muted, marginLeft: 8 },

    shadowContainer: {
        flex: 1,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -15 },
        shadowOpacity: 1,
        shadowRadius: 35,
        elevation: 40,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        backgroundColor: COLORS.cardBg,
    },

    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.cardBg,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden'
    },

    filtersRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
    filterTag: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.muted, borderRadius: 15, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8 },
    filterTagActive: { borderColor: COLORS.primary, backgroundColor: COLORS.navBg },
    filterTagText: { color: COLORS.muted, fontSize: 12 },
    filterTagTextActive: { color: COLORS.text, fontWeight: 'bold' },

    scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },

    catalogCard: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
    imageContainer: { position: 'relative', width: 90, height: 90, borderRadius: 16, overflow: 'hidden', marginRight: 16, backgroundColor: '#2D2E5C' },
    cardImage: { width: '100%', height: '100%' },
    heartIcon: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4 },

    cardContent: { flex: 1, justifyContent: 'center' },
    cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
    cardDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 16, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardType: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
    voirPlusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    voirPlus: { color: COLORS.text, fontSize: 12 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 40 }
});