import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet, FlatList } from 'react-native';
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
    const [dateSort, setDateSort] = useState('default');
    const [visibleCount, setVisibleCount] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [likedItems, setLikedItems] = useState({});

    const availableFilters = ['E-Learning', 'Présentiel', 'Développement Perso.', 'Tech & IT', 'Langues', 'Écologie'];

    const normalizeString = (str) => {
        if (!str) return '';
        return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        return `${API_URL}${imagePath}`;
    };

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
                        if (form.DateHeureRaw) {
                            const d = new Date(form.DateHeureRaw);
                            const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
                            dateAffichee = `${d.getDate()} ${mois[d.getMonth()]} à ${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
                        }
                        return {
                            ...form,
                            isOnline: !!form.isOnline,
                            imageUri: getImageUrl(form.Image),
                            dateLabel: dateAffichee,
                            timestamp: form.DateHeureRaw ? new Date(form.DateHeureRaw).getTime() : null
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
                console.error("Erreur Fetch Catalogue:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let result = [...formations];
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
    }, [searchQuery, activeFilters, dateSort, formations]);

    const toggleFilter = (filter) => {
        setActiveFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
    };

    const toggleLike = async (id) => {
        const isCurrentlyLiked = likedItems[id];
        setLikedItems(prev => ({ ...prev, [id]: !isCurrentlyLiked }));
        try {
            const token = await AsyncStorage.getItem('userToken');
            await fetch(`${API_URL}/formations/${id}/like`, {
                method: isCurrentlyLiked ? 'DELETE' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            setLikedItems(prev => ({ ...prev, [id]: isCurrentlyLiked }));
        }
    };

    const renderCard = ({ item }) => (
        <TouchableOpacity
            style={styles.catalogCard}
            onPress={() => router.push({ pathname: '/FormationDetail', params: { id: item.id } })}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {/* UTILISATION DE L'URL CALCULÉE VIA LA BDD */}
                <Image
                    source={{ uri: item.imageUri }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
                <TouchableOpacity style={styles.heartIcon} onPress={() => toggleLike(item.id)}>
                    <Ionicons
                        name={likedItems[item.id] ? "heart" : "heart-outline"}
                        size={32}
                        color={likedItems[item.id] ? "#EF4444" : "#FFFFFF"}
                        style={styles.thickHeart}
                    />
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
    );

    return (
        <AppBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/AddFormation')} style={styles.addBtn}>
                    <Ionicons name="add" size={20} color="#000" />
                    <Text style={styles.addBtnText}>Ajouter</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Catalogue</Text>

                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color={COLORS.muted} />
                    <TextInput
                        placeholder="Rechercher..."
                        placeholderTextColor={COLORS.muted}
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <TouchableOpacity style={styles.dateInputWrapper} onPress={() => setDateSort(dateSort === 'asc' ? 'desc' : 'asc')}>
                    <Ionicons name={dateSort === 'asc' ? "arrow-up" : "arrow-down"} size={20} color={COLORS.primary} />
                    <Text style={styles.dateText}>Dates</Text>
                </TouchableOpacity>
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

                    {isLoading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={filteredFormations.slice(0, visibleCount)}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderCard}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            onEndReached={() => setVisibleCount(prev => prev + 10)}
                            ListEmptyComponent={<Text style={styles.emptyText}>Aucun résultat trouvé.</Text>}
                        />
                    )}
                </View>
            </View>
            <BottomNav activeTab="Catalogue" />
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        flex: 1,
        textAlign: 'center',
        marginLeft: -10
    },
    addBtn: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10
    },
    addBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 13,
        marginLeft: 4
    },
    settingsBtn: {
        padding: 6,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    searchContainer: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 20, gap: 12 },
    searchInputWrapper: { flex: 2, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 15, paddingHorizontal: 16, height: 44 },
    searchInput: { flex: 1, color: COLORS.text, marginLeft: 10, fontSize: 13 },
    dateInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 15, height: 44 },
    dateText: { color: COLORS.muted, marginLeft: 6, fontSize: 12 },
    shadowContainer: { flex: 1, backgroundColor: COLORS.cardBg, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    mainContainer: { flex: 1, paddingHorizontal: 20 },
    filtersRow: { paddingVertical: 20 },
    filterTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
    filterTagActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterTagText: { color: COLORS.muted, fontSize: 13 },
    filterTagTextActive: { color: COLORS.text, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 100 },
    catalogCard: { flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    imageContainer: { width: 80, height: 80, marginRight: 15, position: 'relative', zIndex: 1 },
    cardImage: { width: '100%', height: '100%', borderRadius: 15, backgroundColor: '#2D2E5C' },
    heartIcon: { position: 'absolute', top: -10, right: -10, zIndex: 10 },
    thickHeart: { textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, fontWeight: 'bold' },
    cardContent: { flex: 1, justifyContent: 'space-between' },
    cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    cardDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 16 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    cardType: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold' },
    voirPlus: { color: COLORS.text, fontSize: 11, opacity: 0.6 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 50 }
});