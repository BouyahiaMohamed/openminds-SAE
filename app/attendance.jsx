import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/ui/UI'; // Adapte le chemin selon ton arborescence
import { COLORS } from '../constants/theme';
import { API_URL } from '../config';

export default function AttendancePage() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchParticipants = async () => {

            try {
                const token = await AsyncStorage.getItem('userToken');

                const res = await fetch(`${API_URL}/sessions/${id}/participants`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });


                if (res.ok) {
                    const data = await res.json();
                    setParticipants(data);
                } else {
                    const textError = await res.text();
                    Alert.alert("Erreur", "Impossible de récupérer les participants.");
                }
            } catch (error) {
                console.error("👉 ERREUR FATALE (Réseau ou Code) :", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchParticipants();
        } else {
            setIsLoading(false);
        }
    }, [id]);

    // ==========================================
    // LOGIQUE POUR COCHER/DÉCOCHER
    // ==========================================
    const togglePresence = (userId, isPresentValue) => {
        setParticipants(currentParticipants =>
            currentParticipants.map(p =>
                p.id_user === userId ? { ...p, isPresent: isPresentValue } : p
            )
        );
    };

    // ==========================================
    // SAUVEGARDE EN BASE DE DONNÉES
    // ==========================================
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            const attendances = participants.map(p => ({
                userId: p.id_user,
                isPresent: p.isPresent
            }));

            const res = await fetch(`${API_URL}/sessions/${id}/attendance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ attendances })
            });

            if (res.ok) {
                Alert.alert("Succès", "L'appel a été validé !");
                router.back();
            } else {
                Alert.alert("Erreur", "Un problème est survenu lors de la sauvegarde.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Erreur", "Impossible de joindre le serveur.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppBackground>
            <View style={styles.container}>
                {/* HEADER (Sans BottomNav, juste la flèche) */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Suivi de Présence</Text>
                    <View style={{ width: 44 }} /> {/* Espace vide pour centrer le titre */}
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#81E6D9" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            <Text style={styles.subtitle}>Liste des participants</Text>

                            {/* LISTE DES ÉLÈVES */}
                            {participants.map((user) => (
                                <View key={user.id_user} style={styles.userCard}>
                                    <Text style={styles.userName}>{user.userName}</Text>

                                    <View style={styles.checkboxGroup}>
                                        {/* BOUTON PRÉSENT */}
                                        <TouchableOpacity
                                            style={styles.checkWrapper}
                                            onPress={() => togglePresence(user.id_user, 1)}
                                        >
                                            <Ionicons
                                                name={user.isPresent === 1 ? "checkbox" : "square-outline"}
                                                size={28}
                                                color={user.isPresent === 1 ? "#38BDF8" : COLORS.muted}
                                            />
                                            <Text style={styles.checkLabel}>Présent</Text>
                                        </TouchableOpacity>

                                        {/* BOUTON ABSENT */}
                                        <TouchableOpacity
                                            style={styles.checkWrapper}
                                            onPress={() => togglePresence(user.id_user, 0)}
                                        >
                                            <Ionicons
                                                name={user.isPresent === 0 ? "checkbox" : "square-outline"}
                                                size={28}
                                                color={user.isPresent === 0 ? "#38BDF8" : COLORS.muted}
                                            />
                                            <Text style={styles.checkLabel}>Absent</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* BOUTONS D'ACTION (Fixés en bas) */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.scanBtn}>
                                <Ionicons name="qr-code-outline" size={20} color={COLORS.text} />
                                <Text style={styles.scanBtnText}>Scan QR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.validateBtn, isSaving && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#1A1B3A" />
                                ) : (
                                    <Text style={styles.validateBtnText}>Valider la séance</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
    backButton: { width: 44, height: 44, backgroundColor: '#1C1D3B', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },

    // Liste
    scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
    subtitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 16 },
    userCard: { backgroundColor: '#1C1D3B', borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    userName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', flex: 1 },

    // Checkboxes
    checkboxGroup: { flexDirection: 'row', gap: 16 },
    checkWrapper: { alignItems: 'center' },
    checkLabel: { color: COLORS.text, fontSize: 9, marginTop: 4 },

    // Footer
    footer: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 },
    scanBtn: { flexDirection: 'row', backgroundColor: '#2D2E5C', paddingVertical: 16, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12, gap: 10 },
    scanBtnText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    validateBtn: { backgroundColor: '#81E6D9', paddingVertical: 16, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    validateBtnText: { color: '#1A1B3A', fontSize: 16, fontWeight: 'bold' }
});