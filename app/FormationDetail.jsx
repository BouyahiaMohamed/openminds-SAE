import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Platform, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { AppBackground } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';

export default function FormationDetail() {
    const { id } = useLocalSearchParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', onConfirm: null });
    const [mapRegion, setMapRegion] = useState(null);

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
            android: `geo:0,0?q=${encoded}`,
            default: `https://www.google.com/maps/search/?api=1&query=${encoded}`
        });
        Linking.openURL(url);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id || isFetching) return;
            setIsFetching(true);
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

                const [resDetails, resLikes] = await Promise.all([
                    fetch(`${API_URL}/formations/${id}`, { headers }).then(r => r.json()),
                    fetch(`${API_URL}/likes`, { headers }).then(r => r.json())
                ]);

                setDetails(resDetails);
                setIsLiked(resLikes?.some(l => l.Id_Formation === parseInt(id)) || false);

                if (!resDetails.isOnline && resDetails.Adresse) {
                    const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(resDetails.Adresse)}`, {
                        headers: { 'User-Agent': 'OpenMindsApp/1.0' }
                    }).then(r => r.json());

                    if (osmRes && osmRes.length > 0) {
                        setMapRegion({ lat: osmRes[0].lat, lon: osmRes[0].lon });
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
                setIsFetching(false);
            }
        };
        fetchData();
    }, [id]);

    const handleEnrollment = async (method) => {
        if (isFetching) return;
        setIsFetching(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/formations/${id}/enroll`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPopup({
                    visible: true,
                    title: "Succès",
                    message: method === 'POST' ? "Inscription réussie !" : "Désinscription effectuée.",
                    onConfirm: () => router.replace('/home')
                });
            }
        } catch (error) {
            setPopup({ visible: true, title: "Erreur", message: "Une erreur est survenue." });
        } finally {
            setIsFetching(false);
        }
    };

    const renderMap = () => {
        if (!mapRegion) return <ActivityIndicator size="small" color={COLORS.primary} />;

        const mapHtml = `
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
                <style>body { margin: 0; } #map { height: 100vh; width: 100vw; }</style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map', {zoomControl: false}).setView([${mapRegion.lat}, ${mapRegion.lon}], 14);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                    L.marker([${mapRegion.lat}, ${mapRegion.lon}]).addTo(map);
                </script>
            </body>
        </html>
    `;

        return (
            <View style={styles.mapWrapper}>
                {Platform.OS === 'web' ? (
                    /* Sur WEB, on utilise une iframe standard (pas besoin de WebView) */
                    <iframe
                        title="map"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        srcDoc={mapHtml}
                    />
                ) : (
                    /* Sur MOBILE, on utilise la WebView native */
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: mapHtml }}
                        style={styles.webView}
                        scrollEnabled={false}
                    />
                )}
                <TouchableOpacity style={styles.itineraireBtn} onPress={() => openExternalMap(details.Adresse)}>
                    <Ionicons name="navigate" size={18} color="#FFF" />
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) return <AppBackground><ActivityIndicator size="large" color={COLORS.primary} style={{flex:1}} /></AppBackground>;
    if (!details) return <AppBackground><Text style={styles.errorText}>Formation introuvable.</Text></AppBackground>;

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
                        <Text style={styles.description}>{details.Description || "Pas de description disponible."}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={32} color={isLiked ? "#EF4444" : COLORS.text} style={{marginRight: 15}} />
                    <View style={styles.metaInfo}>
                        <Text style={styles.dateText}>{details.isOnline ? "💻 E-Learning" : "📅 Présentiel"}</Text>
                        <Text style={styles.placesText}>{details.isOnline ? "Illimité" : `${details.nbPlacesRestantes || 0} places restantes`}</Text>
                    </View>
                </View>

                <View style={styles.bottomSection}>
                    <View style={styles.mapContainer}>
                        {!details.isOnline ? renderMap() : (
                            <View style={styles.onlinePlaceholder}>
                                <Ionicons name="laptop-outline" size={40} color={COLORS.muted} />
                            </View>
                        )}
                        <Text style={styles.addressText} numberOfLines={2}>{details.Adresse || "En ligne"}</Text>
                    </View>
                    <View style={styles.formateursContainer}>
                        <Text style={styles.formateursTitle}>Intervenants</Text>
                        <Text style={styles.formateursList}>{details.Formateurs || 'À confirmer'}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.reserveBtn, details.isEnrolled && { backgroundColor: '#EF4444' }]}
                    onPress={() => handleEnrollment(details.isEnrolled ? 'DELETE' : 'POST')}
                >
                    <Text style={styles.reserveBtnText}>{details.isEnrolled ? "Se désinscrire" : "S'inscrire à la formation"}</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal animationType="fade" transparent visible={popup.visible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{popup.title}</Text>
                        <Text style={styles.modalMessage}>{popup.message}</Text>
                        <TouchableOpacity style={styles.modalBtnOK} onPress={() => { setPopup({ ...popup, visible: false }); popup.onConfirm?.(); }}>
                            <Text style={styles.modalBtnOKText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    errorText: { color: COLORS.text, textAlign: 'center', marginTop: 50 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginRight: 40 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    topCard: { flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20 },
    image: { width: 90, height: 90, borderRadius: 15 },
    topCardTextContainer: { flex: 1, marginLeft: 15 },
    description: { color: COLORS.muted, fontSize: 13, lineHeight: 18 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20 },
    metaInfo: { flex: 1 },
    dateText: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },
    placesText: { color: COLORS.muted, fontSize: 12 },
    bottomSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    mapContainer: { flex: 1.3, marginRight: 15 },
    mapWrapper: { height: 140, borderRadius: 15, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    webView: { flex: 1, opacity: 0.9 },
    itineraireBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: COLORS.primary, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    addressText: { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
    onlinePlaceholder: { height: 140, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    formateursContainer: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15 },
    formateursTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    formateursList: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
    reserveBtn: { backgroundColor: COLORS.primary, borderRadius: 15, paddingVertical: 18, alignItems: 'center' },
    reserveBtnText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center' },
    modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    modalMessage: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 20 },
    modalBtnOK: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 10, borderRadius: 10 },
    modalBtnOKText: { color: '#FFF', fontWeight: 'bold' }
});