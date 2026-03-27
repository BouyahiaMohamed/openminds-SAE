import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../constants/theme';
import { AppBackground, BottomNav } from '../components/ui/UI';
import { FormationCard } from '../components/ui/FormationCard';
import { API_URL } from '../config';

export default function ProfilePage() {
    const tabs = ['Badges', 'Progression', 'Mes Formations'];
    const [activeTab, setActiveTab] = useState(tabs[0]);

    // États des données fixes
    const [badges, setBadges] = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    // États spécifiques au calendrier des formations
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [teachingSessions, setTeachingSessions] = useState([]);
    const [isTeachingLoading, setIsTeachingLoading] = useState(false);

    // Refs pour le scroll
    const scrollViewRef = useRef(null);
    const sectionLayouts = useRef({});
    const isTabClick = useRef(false);

    // ==========================================
    // 1. FETCH INITIAL (Badges & Progression)
    // ==========================================
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

                const [resBadges, resProgress] = await Promise.all([
                    fetch(`${API_URL}/my-badges`, { headers }),
                    fetch(`${API_URL}/my-online-progress`, { headers })
                ]);

                if (resBadges.ok) setBadges(await resBadges.json());

                if (resProgress.ok) {
                    const dataProgress = await resProgress.json();
                    setProgressions(dataProgress.map(item => ({
                        ...item,
                        icon: 'chatbubbles-outline',
                        type: 'Ionicons',
                        Progression: item.Progression / 100
                    })));
                }
            } catch (error) {
                console.error("Erreur Profil:", error);
            } finally {
                setIsLoadingInitial(false);
            }
        };

        fetchInitialData();
    }, []);

    // ==========================================
    // 2. FETCH DYNAMIQUE (Sessions par date)
    // ==========================================
    useEffect(() => {
        const fetchTeachingSessions = async () => {
            setIsTeachingLoading(true);
            try {
                const token = await AsyncStorage.getItem('userToken');
                const dateAPI = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                console.log("👉 1. Je demande les sessions du :", dateAPI);

                const res = await fetch(`${API_URL}/my-teaching-sessions/by-date?date=${dateAPI}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log("👉 2. Code HTTP reçu :", res.status);

                if (res.ok) {
                    const data = await res.json();
                    console.log("👉 3. Sessions trouvées :", data.length);
                    setTeachingSessions(data);
                } else {
                    const textError = await res.text();
                    console.log("👉 3 (Erreur). Le serveur dit :", textError);
                }
            } catch (error) {
                console.error("👉 Erreur fetch sessions:", error);
            } finally {
                setIsTeachingLoading(false);
            }
        };
        fetchTeachingSessions();
    }, [selectedDate]);

    // ==========================================
    // LOGIQUE DE NAVIGATION DES JOURS
    // ==========================================
    const addDays = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const formatDateForUI = (date) => {
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (date.toDateString() === tomorrow.toDateString()) return "Demain";
        if (date.toDateString() === yesterday.toDateString()) return "Hier";

        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const getFormattedTime = (dateString, durationMinutes = 90) => {
        const start = new Date(dateString);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        const format = (d) => `${d.getHours()}h${d.getMinutes() === 0 ? '00' : d.getMinutes().toString().padStart(2, '0')}`;
        return `${format(start)} - ${format(end)}`;
    };

    const getStatusStyle = (session) => {
        const isPast = new Date(session.DateHeure) < new Date();
        const statutLabel = session.Statut || (isPast ? 'Terminer' : 'À Venir');

        if (statutLabel.includes('Terminer')) {
            return { icon: 'checkmark-circle', color: '#4ade80', text: 'Terminer' };
        } else {
            return { icon: 'time', color: '#f59e0b', text: 'À Venir' };
        }
    };

    // ==========================================
    // SCROLL & ONGLETS
    // ==========================================
    const scrollToSection = (section) => {
        isTabClick.current = true;
        setActiveTab(section);
        const y = sectionLayouts.current[section];
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
        }
    };

    const handleLayout = (section, event) => {
        sectionLayouts.current[section] = event.nativeEvent.layout.y;
    };

    const handleScrollBeginDrag = () => { isTabClick.current = false; };

    const handleScroll = (event) => {
        if (isTabClick.current) return;
        const scrollY = event.nativeEvent.contentOffset.y;
        let currentSection = tabs[0];
        if (sectionLayouts.current['Mes Formations'] && scrollY >= sectionLayouts.current['Mes Formations'] - 150) {
            currentSection = 'Mes Formations';
        } else if (sectionLayouts.current['Progression'] && scrollY >= sectionLayouts.current['Progression'] - 150) {
            currentSection = 'Progression';
        }
        if (currentSection !== activeTab) setActiveTab(currentSection);
    };

    return (
        <AppBackground>
            <View style={{ flex: 1, paddingTop: 20 }}>
                {/* HEADER */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Profil</Text>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* ONGLETS */}
                <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity key={tab} onPress={() => scrollToSection(tab)} style={styles.tab}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            {activeTab === tab && <View style={styles.activeTabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* CONTENU */}
                <View style={styles.mainContainer}>
                    {isLoadingInitial ? (
                        <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 40 }} />
                    ) : (
                        <ScrollView
                            ref={scrollViewRef}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            onScroll={handleScroll}
                            onScrollBeginDrag={handleScrollBeginDrag}
                            scrollEventThrottle={16}
                        >
                            {/* SECTION 1 : BADGES */}
                            <View onLayout={(e) => handleLayout('Badges', e)} style={styles.section}>
                                <Text style={styles.sectionTitle}>Badges</Text>
                                <View style={styles.badgesContainer}>
                                    {badges.length > 0 ? (
                                        badges.map((badge, index) => (
                                            <View key={badge.id || index} style={styles.badgeWrapper}>
                                                <View style={styles.badgeIconBg}>
                                                    {badge.URLImage ? (
                                                        <Image source={{ uri: badge.URLImage.startsWith('http') ? badge.URLImage : `${API_URL}/${badge.URLImage}` }} style={styles.badgeImage} resizeMode="contain" />
                                                    ) : (
                                                        <Ionicons name="medal" size={32} color="#FFD700" />
                                                    )}
                                                </View>
                                                <Text style={styles.badgeText}>{badge.nomBadge}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>{"Vous n'avez pas encore de badges."}</Text>
                                    )}
                                </View>
                            </View>

                            {/* SECTION 2 : PROGRESSION */}
                            <View onLayout={(e) => handleLayout('Progression', e)} style={styles.section}>
                                <Text style={styles.sectionTitle}>Progression</Text>
                                {progressions.length > 0 ? (
                                    progressions.map(item => (
                                        <FormationCard key={`prog-${item.id}`} item={item} onPress={() => console.log('Cours', item.id)} />
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>{"Aucune formation en cours."}</Text>
                                )}
                            </View>

                            {/* SECTION 3 : MES FORMATIONS (AVEC CALENDRIER) */}
                            <View onLayout={(e) => handleLayout('Mes Formations', e)} style={[styles.section, { paddingBottom: 60 }]}>
                                <Text style={styles.sectionTitle}>Mes sessions à animer</Text>

                                {/* SÉLECTEUR DE DATE */}
                                <View style={styles.dateNavigator}>
                                    <TouchableOpacity onPress={() => addDays(-1)} style={styles.arrowButton}>
                                        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                                    </TouchableOpacity>
                                    <Text style={styles.dateText}>
                                        {formatDateForUI(selectedDate).charAt(0).toUpperCase() + formatDateForUI(selectedDate).slice(1)}
                                    </Text>
                                    <TouchableOpacity onPress={() => addDays(1)} style={styles.arrowButton}>
                                        <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
                                    </TouchableOpacity>
                                </View>

                                {/* LISTE DES SESSIONS DU JOUR */}
                                {isTeachingLoading ? (
                                    <ActivityIndicator size="small" color="#38BDF8" style={{ marginTop: 20 }} />
                                ) : teachingSessions.length > 0 ? (
                                    <View style={styles.bubbleWrapper}>
                                        <View style={styles.bubbleContainer}>
                                            {teachingSessions.map((session, index) => {
                                                const status = getStatusStyle(session);
                                                const isLast = index === teachingSessions.length - 1;

                                                return (
                                                    <TouchableOpacity
                                                        key={session.id_session || index}
                                                        style={[styles.sessionRow, !isLast && styles.borderBottom]}
                                                        onPress={() => router.push({ pathname: '/attendance', params: { id: session.id_session }})}
                                                    >
                                                        <View style={styles.leftContent}>
                                                            <Text style={styles.timeText}>{getFormattedTime(session.DateHeure, session.Duree)}</Text>
                                                            <Text style={styles.titleText}>{session.Titre}</Text>
                                                        </View>
                                                        <View style={styles.rightContent}>
                                                            <Ionicons name={status.icon} size={28} color={status.color} style={{ marginBottom: 4 }} />
                                                            <View style={[styles.statusPill, { backgroundColor: status.color }]}>
                                                                <Text style={styles.statusText}>{status.text}</Text>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                        <View style={styles.dateSeparator}>
                                            <Text style={styles.dateSeparatorText}>{teachingSessions.length} Session{teachingSessions.length > 1 ? 's' : ''}</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={styles.emptyText}>Aucune session prévue pour ce jour.</Text>
                                )}
                            </View>

                        </ScrollView>
                    )}
                </View>
                <BottomNav activeTab="Profile" />
            </View>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    // --- Header & Tabs (Inchangés) ---
    headerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, position: 'relative' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    settingsBtn: { position: 'absolute', right: 24, top: 60 },
    tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 15 },
    tab: { alignItems: 'center', paddingBottom: 8 },
    tabText: { color: COLORS.notSelected, fontSize: 13, fontWeight: '600' },
    activeTabText: { color: COLORS.selected, fontWeight: 'bold' },
    activeTabIndicator: { position: 'absolute', bottom: 0, width: '100%', height: 3, backgroundColor: COLORS.selected, borderRadius: 2 },

    // --- Layout & Typo ---
    mainContainer: { flex: 1, backgroundColor: COLORS.sectionBg, borderTopLeftRadius: 35, borderTopRightRadius: 35, overflow: 'hidden' },
    scrollContent: { padding: 24, paddingBottom: 100 },
    section: { paddingBottom: 32 },
    sectionTitle: { color: COLORS.muted, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginVertical: 20, fontStyle: 'italic', fontSize: 14 },

    // --- Badges ---
    badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    badgeWrapper: { width: '33%', alignItems: 'center', marginBottom: 24 },
    badgeIconBg: { backgroundColor: '#1C1D3B', width: 75, height: 75, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    badgeImage: { width: 40, height: 40 },
    badgeText: { color: COLORS.text, fontSize: 11, textAlign: 'center', fontWeight: '600', paddingHorizontal: 2 },

    // --- Navigation Calendrier ---
    dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C1D3B', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 20 },
    arrowButton: { padding: 5 },
    dateText: { color: COLORS.text, fontSize: 15, fontWeight: 'bold' },

    // --- Design Bulles Formations (Maquette) ---
    bubbleWrapper: { alignItems: 'center', marginBottom: 10 },
    bubbleContainer: { backgroundColor: '#26284A', borderRadius: 24, paddingVertical: 5, width: '100%' },
    sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
    leftContent: { flex: 1, justifyContent: 'center' },
    timeText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
    titleText: { color: '#E2E8F0', fontSize: 14 },
    rightContent: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#1C1D3B', fontSize: 10, fontWeight: 'bold' },

    // Séparateur
    dateSeparator: { backgroundColor: '#1C1D3B', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, marginTop: -12, borderWidth: 2, borderColor: COLORS.sectionBg },
    dateSeparatorText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' }
});