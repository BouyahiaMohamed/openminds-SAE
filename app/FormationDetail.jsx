import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Palette de couleurs affinée pour un rendu plus "Premium"
const COLORS = {
    background: '#13142b',
    cardBg: '#1e1f3d', // Un peu plus clair pour détacher les éléments
    text: '#ffffff',
    muted: '#b5b5c3',
    primary: '#56589f', // Violet légèrement plus doux
    accent: '#FF4B4B'
};

export default function FormationDetail() {
    const { id, image } = useLocalSearchParams();
    const [details, setDetails] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [placesRestantes, setPlacesRestantes] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const token = await AsyncStorage.getItem('userToken');
                const resDetails = await axios.get(`${API_URL}/formations/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                setDetails(resDetails.data);
                setPlacesRestantes(resDetails.data.nbPlacesRestantes);

                const resSimilar = await axios.get(`${API_URL}/formations/${id}/similar`, { headers: { 'Authorization': `Bearer ${token}` } });
                setSimilar(resSimilar.data);
            } catch (error) {
                console.log("Erreur :", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleReserve = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.post(`${API_URL}/formations/${id}/enroll`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert(response.data.message);
            if (response.data.placesRestantes !== undefined) setPlacesRestantes(response.data.placesRestantes);
        } catch (error) {
            alert(error.response?.data?.message || "Erreur lors de l'inscription.");
        }
    };

    if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    if (!details) return <View style={styles.centerContainer}><Text style={styles.errorText}>Formation introuvable.</Text></View>;

    return (
        <View style={styles.container}>
            {/* HEADER PROPRE */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/'); // Mets ici le chemin de ton catalogue si c'est différent (ex: '/catalogue')
                        }
                    }}
                    style={styles.backBtn}
                >
                    <Ionicons name="chevron-back" size={26} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{details.Titre}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }}>
                <View style={styles.mainPadding}>

                    {/* SECTION IMAGE + DESC */}
                    <View style={styles.topSection}>
                        <Image source={{ uri: image || 'https://loremflickr.com/200/200/nature' }} style={styles.mainImage} />
                        <View style={styles.descContainer}>
                            <Text style={styles.descriptionText}>
                                {details.Description || "Découvrez cette session exceptionnelle. Plus de détails seront fournis par le formateur."}
                            </Text>
                        </View>
                    </View>

                    {/* LIGNE STATS (Aérée et alignée) */}
                    <View style={styles.statsRow}>
                        <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.iconBtn}>
                            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={32} color={isLiked ? COLORS.accent : COLORS.text} />
                        </TouchableOpacity>
                        <View style={styles.statBadge}>
                            <Ionicons name="calendar-outline" size={16} color={COLORS.muted} style={{ marginRight: 5 }} />
                            <Text style={styles.dateText}>{details.isOnline ? "E-Learning" : "12 déc. 20h"}</Text>
                        </View>
                        <View style={styles.statBadge}>
                            <Ionicons name="people-outline" size={16} color={COLORS.muted} style={{ marginRight: 5 }} />
                            <Text style={styles.placesText}>{details.isOnline ? "Illimité" : `${placesRestantes}/${details.nbPlaces}`}</Text>
                        </View>
                    </View>

                    {/* SECTION CARTE + FORMATEUR */}
                    <View style={styles.middleSection}>
                        <View style={styles.mapColumn}>
                            <Image
                                source={{ uri: 'https://images.placeholders.dev/?width=300&height=300&text=Carte+Détaillée&theme=light' }}
                                style={styles.mapImage}
                            />
                            <Text style={styles.addressText} numberOfLines={2}>{details.Adresse || "87 rue Boulogne 93300"}</Text>
                        </View>

                        <View style={styles.teacherColumn}>
                            <Text style={styles.teacherTitle}>Formateur.s :</Text>
                            <View style={styles.teacherList}>
                                {details.Formateurs ? details.Formateurs.split(',').map((f, i) => (
                                    <Text key={i} style={styles.teacherNames}>• {f.trim()}</Text>
                                )) : (
                                    <>
                                        <Text style={styles.teacherNames}>• Jean-Eudes</Text>
                                        <Text style={styles.teacherNames}>• Malik Vision</Text>
                                        <Text style={styles.teacherNames}>• Sandra M.</Text>
                                    </>
                                )}
                            </View>
                            <TouchableOpacity style={styles.voirPlusBtn}>
                                <Text style={styles.voirPlusText}>Profil formateur</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* BOUTON RÉSERVER */}
                    <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve} activeOpacity={0.8}>
                        <Text style={styles.reserveBtnText}>Réserver ma place</Text>
                    </TouchableOpacity>
                </View>

                {/* ZONE FORMATIONS SIMILAIRES */}
                <View style={styles.similarSection}>
                    <Text style={styles.similarTitle}>Formations similaires</Text>

                    {similar.length > 0 ? (
                        similar.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.similarCard}
                                activeOpacity={0.7}
                                onPress={() => router.push({ pathname: '/FormationDetail', params: { id: item.id } })}
                            >
                                <View style={styles.similarImageContainer}>
                                    <Image source={{ uri: `https://loremflickr.com/150/150/learning?lock=${item.id}` }} style={styles.similarImage} />
                                    <View style={styles.similarHeartOverlay}>
                                        <Ionicons name="heart-outline" size={18} color="#fff" />
                                    </View>
                                </View>

                                <View style={styles.similarContent}>
                                    <Text style={styles.similarCardTitle} numberOfLines={1}>{item.Titre}</Text>
                                    <Text style={styles.similarCardDesc} numberOfLines={2}>{item.Description}</Text>

                                    <View style={styles.similarBottomRow}>
                                        <Text style={styles.similarTag}>{item.isOnline ? 'E-Learning' : 'Présentiel'}</Text>
                                        <View style={styles.similarActions}>
                                            <Ionicons name="download-outline" size={18} color={COLORS.muted} />
                                            <Text style={styles.voirPlusLink}>Voir plus</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 20 }}>Aucune suggestion pour le moment.</Text>
                    )}

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: COLORS.text, fontSize: 16 },
    mainPadding: { paddingHorizontal: 20, paddingTop: 10 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 15 },
    backBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', letterSpacing: 0.5 },

    // Top Section
    topSection: { flexDirection: 'row', marginBottom: 25, alignItems: 'flex-start' },
    mainImage: { width: 120, height: 120, borderRadius: 18, backgroundColor: COLORS.cardBg },
    descContainer: { flex: 1, paddingLeft: 18, justifyContent: 'center' },
    descriptionText: { color: COLORS.muted, fontSize: 13.5, lineHeight: 20, textAlign: 'justify' },

    // Stats Row
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, paddingHorizontal: 5 },
    iconBtn: { padding: 5 },
    statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
    dateText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
    placesText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

    // Middle Section
    middleSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
    mapColumn: { flex: 1.2, paddingRight: 15 },
    mapImage: { width: '100%', aspectRatio: 1, borderRadius: 18, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    addressText: { color: COLORS.text, fontSize: 12, textAlign: 'center', opacity: 0.9 },

    teacherColumn: { flex: 1, paddingLeft: 5, justifyContent: 'center' },
    teacherTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
    teacherList: { marginBottom: 12 },
    teacherNames: { color: COLORS.muted, fontSize: 13, lineHeight: 22 },
    voirPlusBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: 'rgba(86, 88, 159, 0.1)' },
    voirPlusText: { color: COLORS.text, fontSize: 11, fontWeight: '500' },

    // Reserve Button
    reserveBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 25, alignItems: 'center', marginBottom: 35, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    reserveBtnText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

    // Similar Section
    similarSection: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, minHeight: 400, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 10 },
    similarTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },

    similarCard: { flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 20 },
    similarImageContainer: { position: 'relative' },
    similarImage: { width: 85, height: 85, borderRadius: 14 },
    similarHeartOverlay: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 4 },
    similarContent: { flex: 1, paddingLeft: 15, justifyContent: 'space-around' },
    similarCardTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
    similarCardDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 16 },
    similarBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    similarTag: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
    similarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    voirPlusLink: { color: COLORS.muted, fontSize: 12, textDecorationLine: 'underline' }
});