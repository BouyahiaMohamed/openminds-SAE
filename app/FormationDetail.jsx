import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// IMPORT DES CARTES (On a viré expo-location !)
import MapView, { Marker } from 'react-native-maps';

import { AppBackground } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';

export default function FormationDetail() {
    const { id } = useLocalSearchParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);

    // Coordonnées par défaut (Paris) si l'adresse est introuvable
    const defaultLocation = { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    const [mapRegion, setMapRegion] = useState(null);
    const [geoFailed, setGeoFailed] = useState(false);

    const getDynamicImageUrl = (titre, id) => {
        const str = titre ? titre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
        let category = "education,study";
        if (/jardin|nature|plante/i.test(str)) category = "nature,garden";
        else if (/carbone|climat/i.test(str)) category = "environment,ecology";
        else if (/agile|cyber|digital/i.test(str)) category = "technology,computer";
        return `https://loremflickr.com/300/300/${category}?lock=${id}`;
    };

    const openExternalMap = (adresse) => {
        if (!adresse) return;
        const encoded = encodeURIComponent(adresse);
        const url = Platform.select({
            ios: `maps:0,0?q=${encoded}`,
            android: `geo:0,0?q=${encoded}(${encoded})`
        });
        Linking.canOpenURL(url).then(supported => {
            if (supported) Linking.openURL(url);
            else Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [resDetails, resLikes] = await Promise.all([
                    axios.get(`${API_URL}/formations/${id}`, { headers }),
                    axios.get(`${API_URL}/likes`, { headers })
                ]);

                const fetchedDetails = resDetails.data;
                setDetails(fetchedDetails);
                setIsLiked(resLikes.data.some(l => l.Id_Formation === parseInt(id)));

                // 🌍 RECHERCHE GPS 100% OPENSTREETMAP (Aucune permission requise)
                if (!fetchedDetails.isOnline && fetchedDetails.Adresse) {
                    try {
                        const osmRes = await axios.get(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fetchedDetails.Adresse)}`,
                            { headers: { 'User-Agent': 'OpenMindsApp/1.0' } }
                        );

                        if (osmRes.data && osmRes.data.length > 0) {
                            setMapRegion({
                                latitude: parseFloat(osmRes.data[0].lat),
                                longitude: parseFloat(osmRes.data[0].lon),
                                latitudeDelta: 0.01, // Zoom rapproché
                                longitudeDelta: 0.01
                            });
                            setGeoFailed(false);
                        } else {
                            // Si OpenStreetMap ne trouve pas la rue exacte
                            setMapRegion(defaultLocation);
                            setGeoFailed(true);
                        }
                    } catch (error) {
                        console.log("Erreur de géocodage silencieuse :", error.message);
                        setMapRegion(defaultLocation);
                        setGeoFailed(true);
                    }
                }

            } catch (error) {
                console.error("Erreur API :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleToggleLike = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            if (isLiked) await axios.delete(`${API_URL}/formations/${id}/like`, { headers });
            else await axios.post(`${API_URL}/formations/${id}/like`, {}, { headers });

            setIsLiked(!isLiked);
        } catch (error) {
            console.error("Erreur like:", error);
        }
    };

    const handleReserve = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(`${API_URL}/formations/${id}/enroll`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            Alert.alert("Succès", "Inscription réussie !", [
                { text: "OK", onPress: () => router.replace('/home') }
            ]);
        } catch (error) {
            Alert.alert("Erreur", error.response?.data?.message || "Erreur lors de l'inscription.");
        }
    };

    const handleUnenroll = async () => {
        Alert.alert(
            "Désinscription",
            "Voulez-vous vraiment vous désinscrire de cette session ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Oui, me désinscrire",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('userToken');
                            await axios.delete(`${API_URL}/formations/${id}/enroll`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            Alert.alert("Désinscrit", "Votre place a été libérée.", [
                                { text: "OK", onPress: () => router.replace('/home') }
                            ]);
                        } catch (error) {
                            Alert.alert("Erreur", "Impossible de se désinscrire.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <AppBackground><ActivityIndicator size="large" color={COLORS.primary} style={{flex:1}} /></AppBackground>;
    if (!details) return <AppBackground><Text style={styles.errorText}>Formation introuvable.</Text></AppBackground>;

    let dateAffichee = "Date à définir";
    if (details.DateHeure && !details.isOnline) {
        const d = new Date(details.DateHeure);
        const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
        dateAffichee = `${d.getDate()} ${mois[d.getMonth()]} à ${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
    }

    return (
        <AppBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{details.Titre}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                <View style={styles.topCard}>
                    <Image source={{ uri: getDynamicImageUrl(details.Titre, details.id) }} style={styles.image} />
                    <View style={styles.topCardTextContainer}>
                        <Text style={styles.description}>{details.Description || "Pas de description."}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <TouchableOpacity onPress={handleToggleLike} style={styles.heartBtn}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={32}
                            color={isLiked ? "#EF4444" : COLORS.text}
                        />
                    </TouchableOpacity>
                    <View style={styles.metaInfo}>
                        <Text style={styles.dateText}>{details.isOnline ? "💻 E-Learning" : `📅 ${dateAffichee}`}</Text>
                        <Text style={styles.placesText}>
                            {details.isOnline ? "Accès illimité" : `👥 Places : ${details.nbPlacesRestantes || 0} restantes`}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSection}>

                    <View style={styles.mapContainer}>
                        {!details.isOnline ? (
                            <>
                                <View style={styles.mapImageWrapper}>
                                    {mapRegion ? (
                                        <MapView style={styles.mapImage} initialRegion={mapRegion} scrollEnabled={false}>
                                            {!geoFailed && <Marker coordinate={mapRegion} title={details.Titre} />}
                                        </MapView>
                                    ) : (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    )}

                                    <TouchableOpacity style={styles.itineraireBtn} onPress={() => openExternalMap(details.Adresse)}>
                                        <Ionicons name="navigate" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.addressText} numberOfLines={2}>📍 {details.Adresse}</Text>
                            </>
                        ) : (
                            <View style={styles.onlinePlaceholder}>
                                <Ionicons name="laptop-outline" size={36} color={COLORS.muted} />
                                <Text style={styles.addressText}>100% E-Learning</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.formateursContainer}>
                        <Text style={styles.formateursTitle}>Intervenant.s :</Text>
                        <Text style={styles.formateursList}>
                            {details.Formateurs ? details.Formateurs.split(',').map(f => `• ${f.trim()}`).join('\n') : '• À confirmer'}
                        </Text>
                    </View>

                </View>

                {details.isEnrolled ? (
                    <TouchableOpacity style={[styles.reserveBtn, { backgroundColor: '#EF4444' }]} onPress={handleUnenroll}>
                        <Text style={styles.reserveBtnText}>Se désinscrire</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve}>
                        <Text style={styles.reserveBtnText}>Confirmer mon inscription</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    errorText: { color: COLORS.text, textAlign: 'center', marginTop: 50, fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { zIndex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginRight: 40 },
    content: { paddingHorizontal: 20, paddingBottom: 60 },

    topCard: { flexDirection: 'row', marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, alignItems: 'center' },
    image: { width: 100, height: 100, borderRadius: 15 },
    topCardTextContainer: { flex: 1, marginLeft: 15 },
    description: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },

    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20 },
    heartBtn: { marginRight: 20 },
    metaInfo: { flex: 1 },
    dateText: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    placesText: { color: COLORS.muted, fontSize: 13 },

    bottomSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },

    mapContainer: { flex: 1.2, marginRight: 15 },
    mapImageWrapper: { position: 'relative', width: '100%', height: 130, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' },
    mapImage: { width: '100%', height: '100%' },
    itineraireBtn: { position: 'absolute', bottom: 8, right: 8, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 5 },
    addressText: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 8, fontStyle: 'italic', paddingHorizontal: 5 },
    onlinePlaceholder: { width: '100%', height: 130, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },

    formateursContainer: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 15 },
    formateursTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    formateursList: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },

    reserveBtn: { backgroundColor: COLORS.primary, borderRadius: 15, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    reserveBtnText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' }
});