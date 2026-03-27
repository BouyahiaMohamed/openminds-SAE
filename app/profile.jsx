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

    // États des données
    const [badges, setBadges] = useState([]);
    const [progressions, setProgressions] = useState([]);
    const [teachingSessions, setTeachingSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Refs pour le scroll automatique
    const scrollViewRef = useRef(null);
    const sectionLayouts = useRef({});
    const isTabClick = useRef(false);

    useEffect(() => {
             const fetchProfileData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

                const [resBadges, resProgress, resTeaching] = await Promise.all([
                    fetch(`${API_URL}/my-badges`, { headers }),
                    fetch(`${API_URL}/my-online-progress`, { headers }),
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

                if (resTeaching.ok) {
                    const dataTeaching = await resTeaching.json();
                    setTeachingSessions(dataTeaching.map(item => ({
                        ...item,
                        icon: 'easel-outline',
                        type: 'Ionicons',
                        Statut: 'À venir',
                        DateHeure: new Date(item.DateHeure).toLocaleDateString('fr-FR', {
                            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                        })
                    })));
                }
            } catch (error) {
                console.error("Erreur Profil:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    // ==========================================
    // GESTION DU SCROLL ET DES ONGLETS
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

    const handleScrollBeginDrag = () => {
        isTabClick.current = false;
    };

    const handleScroll = (event) => {
        if (isTabClick.current) return;

        const scrollY = event.nativeEvent.contentOffset.y;
        let currentSection = tabs[0]; // 'Badges' par défaut

        // On vérifie de bas en haut dans quelle section on se trouve
        if (sectionLayouts.current['Mes Formations'] && scrollY >= sectionLayouts.current['Mes Formations'] - 150) {
            currentSection = 'Mes Formations';
        } else if (sectionLayouts.current['Progression'] && scrollY >= sectionLayouts.current['Progression'] - 150) {
            currentSection = 'Progression';
        }

        if (currentSection !== activeTab) {
            setActiveTab(currentSection);
        }
    };

    return (
        <AppBackground>
            <View style={{ flex: 1, paddingTop: 20 }}>

                {/* HEADER CENTRÉ */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Profil</Text>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                        <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* ONGLETS DE NAVIGATION */}
                <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity key={tab} onPress={() => scrollToSection(tab)} style={styles.tab}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            {activeTab === tab && <View style={styles.activeTabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* CONTENU AVEC SCROLL */}
                <View style={styles.mainContainer}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
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
                                                        <Image
                                                            source={{ uri: badge.URLImage.startsWith('http') ? badge.URLImage : `${API_URL}/${badge.URLImage}` }}
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

                            {/* SECTION 3 : MES FORMATIONS */}
                            <View onLayout={(e) => handleLayout('Mes Formations', e)} style={[styles.section, { paddingBottom: 60 }]}>
                                <Text style={styles.sectionTitle}>Mes sessions à animer</Text>
                                {teachingSessions.length > 0 ? (
                                    teachingSessions.map(item => (
                                        <FormationCard key={`teach-${item.id_session}`} item={item} onPress={() => console.log('Session', item.id_session)} />
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>{"Vous n'avez aucune session prévue en tant que formateur."}</Text>
                                )}
                            </View>

                        </ScrollView>
                    )}
                </View>

                {/* NAVBAR DU BAS */}
                <BottomNav activeTab="Profile" />
            </View>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    // --- Header & Tabs ---
    headerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, position: 'relative' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
    settingsBtn: { position: 'absolute', right: 24, top: 60 },

    tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 15 },
    tab: { alignItems: 'center', paddingBottom: 8 },
    tabText: { color: COLORS.notSelected, fontSize: 13, fontWeight: '600' },
    activeTabText: { color: COLORS.selected, fontWeight: 'bold' },
    activeTabIndicator: { position: 'absolute', bottom: 0, width: '100%', height: 3, backgroundColor: COLORS.selected, borderRadius: 2 },

    // --- Layout principal ---
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.sectionBg,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden'
    },
    scrollContent: { padding: 24, paddingBottom: 100 },
    section: { paddingBottom: 32 },
    sectionTitle: { color: COLORS.muted, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginVertical: 20, fontStyle: 'italic', fontSize: 14 },

    // --- Badges ---
    badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    badgeWrapper: { width: '33%', alignItems: 'center', marginBottom: 24 },
    badgeIconBg: { backgroundColor: '#1C1D3B', width: 75, height: 75, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    badgeImage: { width: 40, height: 40 },
    badgeText: { color: COLORS.text, fontSize: 11, textAlign: 'center', fontWeight: '600', paddingHorizontal: 2 }
});