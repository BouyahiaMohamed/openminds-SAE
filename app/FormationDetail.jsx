import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';
import axios from 'axios';

export default function FormationDetail() {
    // C'est ICI que la magie opère avec Expo Router (au lieu de route.params)
    const { id, image } = useLocalSearchParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return; // Sécurité si l'ID met du temps à arriver
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await axios.get(`${API_URL}/formations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setDetails(response.data);
            } catch (error) {
                console.error("Erreur de récupération :", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const handleReserve = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(`${API_URL}/formations/${id}/enroll`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert("Inscription réussie !");
        } catch (error) {
            alert(error.response?.data?.message || "Erreur lors de l'inscription.");
        }
    };

    if (loading) {
        return (
            <AppBackground>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1, justifyContent: 'center' }} />
            </AppBackground>
        );
    }

    if (!details) {
        return (
            <AppBackground>
                <Text style={{ color: COLORS.text, textAlign: 'center', marginTop: 50 }}>Formation introuvable.</Text>
            </AppBackground>
        );
    }

    // Formatage de la date
    let dateAffichee = "Date à définir";
    if (details.DateHeure && !details.isOnline) {
        const d = new Date(details.DateHeure);
        const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
        const minutes = d.getMinutes() === 0 ? '' : d.getMinutes();
        dateAffichee = `${d.getDate()} ${mois[d.getMonth()]} ${d.getHours()}h${minutes}`;
    }

    return (
        <AppBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{details.Titre}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.topCard}>
                    <Image source={{ uri: image || 'https://via.placeholder.com/150' }} style={styles.image} />
                    <View style={styles.topCardTextContainer}>
                        <Text style={styles.description}>{details.Description}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.heartPlaceholder}>
                        <Ionicons name="heart" size={28} color={COLORS.text} />
                    </View>
                    <Text style={styles.dateText}>{details.isOnline ? "E-Learning" : dateAffichee}</Text>
                    <Text style={styles.placesText}>Places: {details.isOnline ? "Illimité" : `${details.nbPlacesRestantes}/${details.nbPlaces}`}</Text>
                </View>

                <View style={styles.bottomSection}>
                    <View style={styles.mapContainer}>
                        {!details.isOnline ? (
                            <>
                                <Image source={{ uri: 'https://via.placeholder.com/300x200.png?text=Carte+Google+Maps' }} style={styles.mapImage} />
                                <Text style={styles.addressText}>{details.Adresse}</Text>
                            </>
                        ) : (
                            <View style={styles.onlinePlaceholder}>
                                <Ionicons name="laptop-outline" size={40} color={COLORS.muted} />
                                <Text style={styles.addressText}>Formation 100% en ligne</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.formateursContainer}>
                        <Text style={styles.formateursTitle}>Formateur.s :</Text>
                        <Text style={styles.formateursList}>
                            {details.Formateurs ? details.Formateurs.split(',').map(f => `\n- ${f.trim()}`) : '\n- Non assigné'}
                        </Text>
                        <TouchableOpacity style={styles.voirPlusBtn}>
                            <Text style={styles.voirPlusText}>voir plus de ce formateur</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.reserveBtn} onPress={handleReserve}>
                    <Text style={styles.reserveBtnText}>Réserver</Text>
                </TouchableOpacity>
            </ScrollView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { position: 'absolute', left: 20, top: 60, zIndex: 1 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginHorizontal: 30 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    topCard: { flexDirection: 'row', marginBottom: 20 },
    image: { width: 140, height: 140, borderRadius: 15 },
    topCardTextContainer: { flex: 1, marginLeft: 15 },
    description: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    heartPlaceholder: { padding: 5 },
    dateText: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
    placesText: { color: COLORS.muted, fontSize: 14 },
    bottomSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    mapContainer: { flex: 1, marginRight: 15 },
    mapImage: { width: '100%', height: 150, borderRadius: 15 },
    addressText: { color: COLORS.text, fontSize: 11, textAlign: 'center', marginTop: 8 },
    onlinePlaceholder: { width: '100%', height: 150, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    formateursContainer: { flex: 1 },
    formateursTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
    formateursList: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
    voirPlusBtn: { marginTop: 15, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.muted, alignSelf: 'flex-start' },
    voirPlusText: { color: COLORS.muted, fontSize: 10 },
    reserveBtn: { backgroundColor: '#4F46E5', borderRadius: 25, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
    reserveBtnText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' }
});