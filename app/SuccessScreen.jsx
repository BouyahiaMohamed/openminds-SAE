import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../config';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SuccessScreen = () => {
    const params = useLocalSearchParams();

    let badge = null;
    if (params.badge) {
        try {
            badge = JSON.parse(params.badge);
        } catch (e) {
            console.error("Erreur de parsing du badge", e);
        }
    }

    const imageUrl = badge ? `${API_URL}/uploads${badge.URLImage}` : null;

    useEffect(() => {
        const claimBadge = async () => {
            if (!badge || !badge.id) return;

            try {
                const token = await AsyncStorage.getItem('userToken');

                const res = await fetch(`${API_URL}/my-badges/claim`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ badgeId: badge.id })
                });

                const data = await res.json();
            } catch (error) {
                console.error("❌ Erreur claim badge :", error);
            }
        };

        claimBadge();
    }, [badge]);

    if (!badge) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{color: 'red', textAlign: 'center', marginTop: 50}}>
                    Erreur : Données du badge introuvables.
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={styles.congratsText}>Félicitations !</Text>
                <Text style={styles.subText}>Tu as validé ta formation avec succès.</Text>
            </View>

            <View style={styles.badgeSection}>
                <View style={styles.badgeCircle}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.badgeImage}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.badgeTitle}>{badge.nomBadge}</Text>
                <Text style={styles.description}>Ce badge a été ajouté à ton profil.</Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
                    <Text style={styles.downloadButtonText}>Télécharger mon certificat (PDF)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.homeButton}
                    activeOpacity={0.8}
                    onPress={() => router.replace('/home')}
                >
                    <Text style={styles.homeButtonText}>Continuer</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20 },
    header: { alignItems: 'center', marginTop: 40 },
    congratsText: { fontSize: 34, fontWeight: '900', color: '#27AE60' },
    subText: { fontSize: 16, color: '#7F8C8D', marginTop: 8, textAlign: 'center' },
    badgeSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    badgeCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#F7F9F9',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0px 8px 12px rgba(0, 0, 0, 0.15)',
        elevation: 10,
    },
    badgeImage: { width: 130, height: 130 },
    badgeTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
    description: { fontSize: 15, color: '#95A5A6', marginTop: 8 },
    footer: { marginBottom: 20 },
    downloadButton: { padding: 16, borderRadius: 15, alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#3498DB' },
    downloadButtonText: { color: '#3498DB', fontWeight: 'bold', fontSize: 16 },
    homeButton: { backgroundColor: '#3498DB', padding: 18, borderRadius: 15, alignItems: 'center' },
    homeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});

export default SuccessScreen;