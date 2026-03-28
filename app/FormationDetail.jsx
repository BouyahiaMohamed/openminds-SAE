import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';
import axios from 'axios';

export default function FormationDetail() {
    const { id, image } = useLocalSearchParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const fetchDetailsAndLikes = async () => {
            if (!id) return;
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}` };

                // On récupère les détails et l'état du like en parallèle
                const [resDetails, resLikes] = await Promise.all([
                    axios.get(`${API_URL}/formations/${id}`, { headers }),
                    axios.get(`${API_URL}/likes`, { headers })
                ]);

                setDetails(resDetails.data);

                // Vérifier si cette formation est dans la liste des likes de l'utilisateur
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

            if (isLiked) {
                await axios.delete(`${API_URL}/formations/${id}/like`, { headers });
            } else {
                await axios.post(`${API_URL}/formations/${id}/like`, {}, { headers });
            }
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

    // Formatage de la date amélioré (ex: 14h05 au lieu de 14h5)
    let dateAffichee = "Date à définir";
    if (details.DateHeure && !details.isOnline) {
        const d = new Date(details.DateHeure);
        const mois = ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
        const minutes = String(d.getMinutes()).padStart(2, '0');
        dateAffichee = `${d.getDate()} ${mois[d.getMonth()]} à ${d.getHours()}h${minutes}`;
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
                    <Image source={{ uri: image || 'https://via.placeholder.com/150' }} style={styles.image} />
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
                            {details.isOnline ? "Accès illimité" : `👥 Places : ${details.nbPlacesRestantes || 0}/${details.nbPlaces || 0}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSection}>
                    <View style={styles.mapContainer}>
                        {!details.isOnline ? (
                            <>
                                <Image source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=300&h=200&auto=format&fit=crop' }} style={styles.mapImage} />
                                <Text style={styles.addressText}>📍 {details.Adresse || "Adresse non communiquée"}</Text>
                            </>
                        ) : (
                            <View style={styles.onlinePlaceholder}>
                                <Ionicons name="laptop-outline" size={40} color={COLORS.muted} />
                                <Text style={styles.addressText}>Formation 100% digitale</Text>
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

                <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve}>
                    <Text style={styles.reserveBtnText}>Confirmer mon inscription</Text>
                </TouchableOpacity>
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
    topCard: { flexDirection: 'row', marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20 },
    image: { width: 120, height: 120, borderRadius: 15 },
    topCardTextContainer: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    description: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20 },
    heartBtn: { marginRight: 20 },
    metaInfo: { flex: 1 },
    dateText: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
    placesText: { color: COLORS.muted, fontSize: 13 },
    bottomSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    mapContainer: { flex: 1.2, marginRight: 15 },
    mapImage: { width: '100%', height: 120, borderRadius: 15 },
    addressText: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
    onlinePlaceholder: { width: '100%', height: 120, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    formateursContainer: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 15 },
    formateursTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    formateursList: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },
    reserveBtn: { backgroundColor: COLORS.primary, borderRadius: 15, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    reserveBtnText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' }
});