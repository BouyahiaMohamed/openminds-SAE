import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';
import axios from 'axios';

export default function FormationDetail() {
    const { id } = useLocalSearchParams(); // On n'a plus besoin de récupérer 'image' d'ici
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);

    // 👉 1. ON RÉIMPORTE LA FONCTION MAGIQUE ICI (pour qu'elle s'affiche)
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

    // 👉 2. FONCTION POUR OUVRIR LA CARTE EXTERNE (Google Maps / Apple Maps)
    const openMap = (adresse) => {
        if (!adresse) return;

        // On formate l'adresse pour l'URL
        const encodedAddress = encodeURIComponent(adresse);

        // URL pour Apple Maps (iOS) ou Google Maps (Android/iOS si installé)
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const url = Platform.select({
            ios: `${scheme}${encodedAddress}`,
            android: `${scheme}${encodedAddress}(${encodedAddress})`
        });

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Si maps: ne marche pas, on essaie l'URL web de Google Maps
                const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                Linking.openURL(webUrl);
            }
        });
    };

    useEffect(() => {
        const fetchDetailsAndLikes = async () => {
            if (!id) return;
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [resDetails, resLikes] = await Promise.all([
                    axios.get(`${API_URL}/formations/${id}`, { headers }),
                    axios.get(`${API_URL}/likes`, { headers })
                ]);

                setDetails(resDetails.data);
                const liked = resLikes.data.some(l => l.Id_Formation === parseInt(id));
                setIsLiked(liked);

            } catch (error) {
                console.error("Erreur de récupération :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetailsAndLikes();
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

    if (loading) {
        return (
            <AppBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </AppBackground>
        );
    }

    if (!details) {
        return (
            <AppBackground>
                <Text style={styles.errorText}>Formation introuvable.</Text>
            </AppBackground>
        );
    }

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
                    {/* 👉 3. ON UTILISE LA FONCTION MAGIQUE POUR LA PHOTO */}
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
                    {/* 👉 4. ON REND LA CARTE CLIQUABLE VERS GOOGLE MAPS */}
                    <TouchableOpacity
                        style={styles.mapContainer}
                        onPress={() => !details.isOnline && openMap(details.Adresse)}
                        activeOpacity={details.isOnline ? 1 : 0.7}
                    >
                        {!details.isOnline ? (
                            <>
                                {/* On garde l'image de placeholder mais on l'assombrit un peu */}
                                <View style={styles.mapImageWrapper}>
                                    <Image source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=300&h=200&auto=format&fit=crop' }} style={styles.mapImage} />
                                    <View style={styles.mapOverlay}>
                                        <Ionicons name="location" size={30} color={COLORS.primary} />
                                        <Text style={styles.openMapText}>Ouvrir l'itinéraire</Text>
                                    </View>
                                </View>
                                <Text style={styles.addressText} numberOfLines={2}>📍 {details.Adresse || "Adresse non communiquée"}</Text>
                            </>
                        ) : (
                            <View style={styles.onlinePlaceholder}>
                                <Ionicons name="laptop-outline" size={40} color={COLORS.muted} />
                                <Text style={styles.addressText}>Formation 100% digitale</Text>
                            </View>
                        )}
                    </TouchableOpacity>

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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    mapImageWrapper: { position: 'relative', width: '100%', height: 120, borderRadius: 15, overflow: 'hidden' },
    mapImage: { width: '100%', height: '100%' },
    mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    openMapText: { color: '#FFF', fontSize: 10, marginTop: 4, fontWeight: 'bold' },
    addressText: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 8, fontStyle: 'italic', paddingHorizontal: 5 },
    onlinePlaceholder: { width: '100%', height: 120, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    formateursContainer: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 15 },
    formateursTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    formateursList: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
    reserveBtn: { backgroundColor: COLORS.primary, borderRadius: 15, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    reserveBtnText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' }
});