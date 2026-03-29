import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Platform, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';
import { AppBackground } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';

export default function FormationDetail() {
    const { id } = useLocalSearchParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', isChoice: false, onConfirm: null });
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
            if (!id || isFetching) return;
            setIsFetching(true);
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Connection': 'close'
                };

                const [resDetails, resLikes] = await Promise.all([
                    fetch(`${API_URL}/formations/${id}`, { headers }).then(r => r.json()),
                    fetch(`${API_URL}/likes`, { headers }).then(r => r.json())
                ]);

                setDetails(resDetails);
                setIsLiked(resLikes.some(l => l.Id_Formation === parseInt(id)));

                if (!resDetails.isOnline && resDetails.Adresse) {
                    try {
                        const osmRes = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(resDetails.Adresse)}`,
                            { headers: { 'User-Agent': 'OpenMindsApp/1.0' } }
                        ).then(r => r.json());

                        if (osmRes && osmRes.length > 0) {
                            setMapRegion({
                                latitude: parseFloat(osmRes[0].lat),
                                longitude: parseFloat(osmRes[0].lon),
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01
                            });
                            setGeoFailed(false);
                        } else {
                            setMapRegion(defaultLocation);
                            setGeoFailed(true);
                        }
                    } catch (e) {
                        setMapRegion(defaultLocation);
                        setGeoFailed(true);
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

    const handleToggleLike = async () => {
        if (isFetching) return;
        try {
            const token = await AsyncStorage.getItem('userToken');
            const method = isLiked ? 'DELETE' : 'POST';
            await fetch(`${API_URL}/formations/${id}/like`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Connection': 'close'
                }
            });
            setIsLiked(!isLiked);
        } catch (error) {
            console.error(error);
        }
    };

    const handleReserve = async () => {
        if (isFetching) return;
        setIsFetching(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/formations/${id}/enroll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Connection': 'close'
                }
            });
            if (res.ok) {
                setPopup({
                    visible: true,
                    title: "Succès",
                    message: "Inscription réussie !",
                    isChoice: false,
                    onConfirm: () => router.replace('/home')
                });
            } else {
                const data = await res.json();
                throw new Error(data.message);
            }
        } catch (error) {
            setPopup({ visible: true, title: "Erreur", message: error.message, isChoice: false, onConfirm: null });
        } finally {
            setIsFetching(false);
        }
    };

    const confirmUnenroll = async () => {
        try {
            setPopup({ ...popup, visible: false });
            const token = await AsyncStorage.getItem('userToken');
            await fetch(`${API_URL}/formations/${id}/enroll`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Connection': 'close'
                }
            });
            setTimeout(() => {
                setPopup({
                    visible: true,
                    title: "Désinscrit",
                    message: "Votre place a été libérée.",
                    isChoice: false,
                    onConfirm: () => router.replace('/home')
                });
            }, 500);
        } catch (error) {
            setPopup({ visible: true, title: "Erreur", message: "Impossible de se désinscrire.", isChoice: false, onConfirm: null });
        }
    };

    const handleUnenroll = () => {
        setPopup({
            visible: true,
            title: "Désinscription",
            message: "Voulez-vous vraiment vous désinscrire ?",
            isChoice: true,
            onConfirm: confirmUnenroll
        });
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
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={32} color={isLiked ? "#EF4444" : COLORS.text} />
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

                <TouchableOpacity
                    style={[styles.reserveBtn, details.isEnrolled && { backgroundColor: '#EF4444' }]}
                    onPress={details.isEnrolled ? handleUnenroll : handleReserve}
                    disabled={isFetching}
                >
                    <Text style={styles.reserveBtnText}>{details.isEnrolled ? "Se désinscrire" : "Confirmer mon inscription"}</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal animationType="fade" transparent={true} visible={popup.visible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons
                            name={popup.title === "Erreur" ? "close-circle" : (popup.isChoice ? "help-circle" : "checkmark-circle")}
                            size={60}
                            color={popup.title === "Erreur" ? "#EF4444" : COLORS.primary}
                            style={styles.modalIcon}
                        />
                        <Text style={styles.modalTitle}>{popup.title}</Text>
                        <Text style={styles.modalMessage}>{popup.message}</Text>
                        <View style={styles.modalButtonsContainer}>
                            {popup.isChoice ? (
                                <>
                                    <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setPopup({ ...popup, visible: false })}>
                                        <Text style={styles.modalBtnCancelText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.modalBtnDanger} onPress={popup.onConfirm}>
                                        <Text style={styles.modalBtnDangerText}>Désinscrire</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity style={styles.modalBtnOK} onPress={() => { setPopup({ ...popup, visible: false }); if(popup.onConfirm) popup.onConfirm(); }}>
                                    <Text style={styles.modalBtnOKText}>OK</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
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
    reserveBtnText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center' },
    modalIcon: { marginBottom: 15 },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    modalMessage: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 25 },
    modalButtonsContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    modalBtnCancel: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, borderRadius: 12, marginRight: 10, alignItems: 'center' },
    modalBtnCancelText: { color: COLORS.text, fontSize: 16 },
    modalBtnDanger: { flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 12, marginLeft: 10, alignItems: 'center' },
    modalBtnDangerText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    modalBtnOK: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    modalBtnOKText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});