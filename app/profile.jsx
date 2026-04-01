import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { COLORS } from '../constants/theme';
import { AppBackground, BottomNav } from '../components/ui/UI';
import { FormationCard } from '../components/ui/FormationCard';
import { API_URL } from '../config';

LocaleConfig.locales['fr'] = {
    monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
    dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
    dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.']
};
LocaleConfig.defaultLocale = 'fr';

export default function ProfilePage() {
    const tabs = ['Badges', 'Progression', 'Mes Formations', 'Calendrier'];
    const [activeTab, setActiveTab] = useState(tabs[0]);

    const [isAdmin, setIsAdmin] = useState(false);
    const [badges, setBadges] = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    // NOUVEAU : State pour les points rouges du calendrier Animateur
    const [markedDatesAnimateur, setMarkedDatesAnimateur] = useState({});

    const [markedDates, setMarkedDates] = useState({});
    const [selectedCalSession, setSelectedCalSession] = useState(null);
    const [modalCalVisible, setModalCalVisible] = useState(false);

    const scrollViewRef = useRef(null);
    const sectionLayouts = useRef({});
    const isTabClick = useRef(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

                // Décoder le JWT pour récupérer isAdmin
                try {
                    const base64Payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64Payload));
                    setIsAdmin(payload.isAdmin === 1 || payload.isAdmin === true);
                } catch (e) {
                    console.warn('Impossible de décoder le token JWT :', e);
                }

                // On ajoute l'appel API pour tes sessions à animer directement ici
                const [resBadges, resProgress, resCalendar, resAnimateur] = await Promise.all([
                    fetch(`${API_URL}/my-badges`, { headers }),
                    fetch(`${API_URL}/my-online-progress`, { headers }),
                    fetch(`${API_URL}/my-formations`, { headers }),
                    fetch(`${API_URL}/my-teaching-sessions`, { headers })
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

                // Calendrier : Tes réservations (Points Bleus)
                if (resCalendar.ok) {
                    const dataCalendar = await resCalendar.json();
                    let datesForCalendar = {};

                    dataCalendar.forEach(form => {
                        if (form.DateHeure) {
                            const dateObj = new Date(form.DateHeure);
                            const dateString = dateObj.toISOString().split('T')[0];
                            const minutes = dateObj.getMinutes() === 0 ? '00' : dateObj.getMinutes().toString().padStart(2, '0');

                            datesForCalendar[dateString] = {
                                marked: true,
                                dotColor: COLORS.primary,
                                title: form.Titre,
                                hour: `${dateObj.getHours()}h${minutes}`,
                                lieu: form.Adresse || "Adresse communiquée par le formateur"
                            };
                        }
                    });
                    setMarkedDates(datesForCalendar);
                }

                // Calendrier : Sessions à animer (Points Rouges)
                if (resAnimateur.ok) {
                    const dataAnimateur = await resAnimateur.json();
                    let datesAnimateur = {};

                    dataAnimateur.forEach(session => {
                        if (session.DateHeure) {
                            const dateString = session.DateHeure.split('T')[0];
                            datesAnimateur[dateString] = {
                                marked: true,
                                dotColor: '#FF4B4B',
                                session: session
                            };
                        }
                    });
                    setMarkedDatesAnimateur(datesAnimateur);
                }

            } catch (error) {
                console.error("Erreur Profil:", error);
            } finally {
                setIsLoadingInitial(false);
            }
        };

        fetchInitialData();
    }, []);

    // Action au clic sur le calendrier de tes réservations
    const handleCalDayPress = (day) => {
        if (markedDates[day.dateString]) {
            setSelectedCalSession(markedDates[day.dateString]);
            setModalCalVisible(true);
        }
    };

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

        if (sectionLayouts.current['Calendrier'] && scrollY >= sectionLayouts.current['Calendrier'] - 150) {
            currentSection = 'Calendrier';
        } else if (sectionLayouts.current['Mes Formations'] && scrollY >= sectionLayouts.current['Mes Formations'] - 150) {
            currentSection = 'Mes Formations';
        } else if (sectionLayouts.current['Progression'] && scrollY >= sectionLayouts.current['Progression'] - 150) {
            currentSection = 'Progression';
        }
        if (currentSection !== activeTab) setActiveTab(currentSection);
    };

    return (
        <AppBackground>
            <View style={{ flex: 1, paddingTop: 20 }}>
                <View style={styles.headerContainer}>

                    {/* Boîte invisible pour équilibrer et centrer le titre */}
                    <View style={{ width: 40 }} />

                    <View style={styles.titleWrapper}>
                        <Text style={styles.headerTitle}>Profil</Text>
                    </View>

                    <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity key={tab} onPress={() => scrollToSection(tab)} style={styles.tab}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            {activeTab === tab && <View style={styles.activeTabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>

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
                            <View onLayout={(e) => handleLayout('Badges', e)} style={styles.section}>
                                <Text style={styles.sectionTitle}>Badges</Text>
                                <View style={styles.badgesContainer}>
                                    {badges.length > 0 ? (
                                        badges.map((badge, index) => (
                                            <View key={badge.id || index} style={styles.badgeWrapper}>
                                                <View style={styles.badgeIconBg}>
                                                    {badge.URLImage ? (
                                                        <Image
                                                            source={{ uri: `${API_URL}/uploads${badge.URLImage}` }}
                                                            style={styles.badgeImage}
                                                            resizeMode="contain"
                                                        />
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

                            {/* LE CALENDRIER SESSIONS À ANIMER (unique, comme avant) */}
                            <View onLayout={(e) => handleLayout('Mes Formations', e)} style={styles.section}>
                                <Text style={styles.sectionTitle}>Mes sessions à animer</Text>

                                <View style={styles.calendarCard}>
                                    <Calendar
                                        enableSwipeMonths={true}
                                        theme={{
                                            calendarBackground: 'transparent',
                                            textSectionTitleColor: COLORS.muted,
                                            selectedDayBackgroundColor: COLORS.primary,
                                            selectedDayTextColor: '#ffffff',
                                            todayTextColor: '#FF4B4B',
                                            dayTextColor: COLORS.text,
                                            textDisabledColor: 'rgba(255,255,255,0.2)',
                                            dotColor: '#FF4B4B',
                                            monthTextColor: COLORS.text,
                                        }}
                                        markedDates={markedDatesAnimateur}
                                        onDayPress={(day) => {
                                            const sessionData = markedDatesAnimateur[day.dateString]?.session;
                                            if (sessionData) {
                                                router.push({ pathname: '/attendance', params: { id: sessionData.id_session || sessionData.id } });
                                            }
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Ancre pour l'onglet Calendrier (sans contenu, comme avant) */}
                            <View onLayout={(e) => handleLayout('Calendrier', e)} />

                            {/* BOUTON ADMIN — visible uniquement si isAdmin */}
                            {isAdmin && (
                                <TouchableOpacity
                                    style={styles.adminDashboardBtn}
                                    onPress={() => router.push('/admin/AdminDashboard')}
                                >
                                    <Ionicons name="speedometer-outline" size={24} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.adminDashboardBtnText}>Tableau de bord Admin</Text>
                                </TouchableOpacity>
                            )}

                        </ScrollView>
                    )}
                </View>
                <BottomNav activeTab="Profile" />
            </View>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    titleWrapper: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    adminBtn: { backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: 8, borderRadius: 12, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    settingsBtn: { padding: 8, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 15 },
    tab: { alignItems: 'center', paddingBottom: 8 },
    tabText: { color: COLORS.notSelected, fontSize: 13, fontWeight: '600' },
    activeTabText: { color: COLORS.selected, fontWeight: 'bold' },
    activeTabIndicator: { position: 'absolute', bottom: 0, width: '100%', height: 3, backgroundColor: COLORS.selected, borderRadius: 2 },
    mainContainer: { flex: 1, backgroundColor: COLORS.sectionBg, borderTopLeftRadius: 35, borderTopRightRadius: 35, overflow: 'hidden' },
    scrollContent: { padding: 24, paddingBottom: 100 },
    section: { paddingBottom: 32 },
    sectionTitle: { color: COLORS.muted, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginVertical: 20, fontStyle: 'italic', fontSize: 14 },
    badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    badgeWrapper: { width: '33%', alignItems: 'center', marginBottom: 24 },
    badgeIconBg: { backgroundColor: '#1C1D3B', width: 75, height: 75, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    badgeImage: { width: 40, height: 40 },
    badgeText: { color: COLORS.text, fontSize: 11, textAlign: 'center', fontWeight: '600', paddingHorizontal: 2 },
    calendarCard: { backgroundColor: '#1C1D3B', borderRadius: 25, padding: 10, paddingBottom: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#1C1D3B', borderRadius: 25, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: 10 },
    closeIconBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 5, borderRadius: 20 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
    infoText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
    actionBtn: { marginTop: 10, backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
    actionBtnText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
    adminDashboardBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary || '#38BDF8',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 40,
        shadowColor: COLORS.primary || '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    adminDashboardBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});