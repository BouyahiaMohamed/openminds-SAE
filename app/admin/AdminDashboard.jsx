import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { AppBackground, BottomNav } from '../../components/ui/UI';
import { COLORS } from '../../constants/theme';
import { API_URL } from '../../config';

const screenWidth = Dimensions.get("window").width;

export default function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState('Année');
    const filters = ['Semaine', 'Ce mois', 'Trimestre', 'Année'];
    const [loading, setLoading] = useState(true);

    const [kpis, setKpis] = useState({ inscrits: 0, tauxReussite: 0, nouvellesSessions: 0 });
    const [chartData, setChartData] = useState({ labels: ["Jan"], datasets: [{ data: [0] }] });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await fetch(`${API_URL}/admin/stats?period=${activeFilter}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setKpis(data.kpis);

                    // Formater les données pour le graphique
                    const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
                    let labels = [];
                    let dataset = [];

                    if (data.chart && data.chart.length > 0) {
                        data.chart.forEach(item => {
                            labels.push(moisNoms[item.mois - 1]);
                            dataset.push(item.count);
                        });
                    } else {
                        labels = ["Aucune data"];
                        dataset = [0];
                    }

                    setChartData({ labels, datasets: [{ data: dataset }] });
                } else {
                    console.error("Erreur droits Admin");
                }
            } catch (error) {
                console.error("Erreur fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [activeFilter]);

    const chartConfig = {
        backgroundGradientFrom: "rgba(255,255,255,0.02)",
        backgroundGradientTo: "rgba(255,255,255,0.05)",
        color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForDots: { r: "5", strokeWidth: "2", stroke: "#10B981" }
    };

    const menuLinks = [
        { title: "Modération Formations", icon: "shield-checkmark", route: "/admin/ModerationFormations" },
        { title: "Calendrier Global", icon: "calendar", route: "/admin/calendar" },
        { title: "Gestion Catalogue", icon: "library", route: "/admin/catalogue" },
        { title: "Validation Certifications", icon: "school", route: "/admin/certifications" },
        { title: "Gestion Partenaires", icon: "business", route: "/admin/partenaires" }
    ];

    return (
        <AppBackground>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard Admin</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* FILTRES PAR PÉRIODE */}
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {filters.map(f => (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setActiveFilter(f)}
                                style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
                            >
                                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* KPIs */}
                        <Text style={styles.sectionTitle}>Chiffres Clés ({activeFilter})</Text>
                        <View style={styles.kpiRow}>
                            <View style={styles.kpiCard}>
                                <Ionicons name="people" size={28} color={COLORS.primary} />
                                <Text style={styles.kpiValue}>{kpis.inscrits}</Text>
                                <Text style={styles.kpiLabel}>Inscrits Total</Text>
                            </View>
                            <View style={styles.kpiCard}>
                                <Ionicons name="trophy" size={28} color="#10B981" />
                                <Text style={styles.kpiValue}>{kpis.tauxReussite}%</Text>
                                <Text style={styles.kpiLabel}>Taux Réussite</Text>
                            </View>
                            <View style={styles.kpiCard}>
                                <Ionicons name="calendar" size={28} color="#F59E0B" />
                                <Text style={styles.kpiValue}>{kpis.nouvellesSessions}</Text>
                                <Text style={styles.kpiLabel}>Sessions</Text>
                            </View>
                        </View>

                        {/* GRAPHIQUE */}
                        <Text style={styles.sectionTitle}>Évolution des inscriptions</Text>
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={chartData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    </>
                )}

                {/* MENU DE NAVIGATION */}
                <Text style={styles.sectionTitle}>Gestion Plateforme</Text>
                <View style={styles.menuContainer}>
                    {menuLinks.map((link, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuButton}
                            onPress={() => router.push(link.route)}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={link.icon} size={22} color={COLORS.text} />
                            </View>
                            <Text style={styles.menuButtonText}>{link.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{height: 100}} />
            </ScrollView>
            <BottomNav activeTab="Menu" />
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    content: { paddingHorizontal: 20 },

    filtersContainer: { marginBottom: 20 },
    filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
    filterBtnActive: { backgroundColor: 'rgba(79, 70, 229, 0.2)', borderColor: COLORS.primary },
    filterText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
    filterTextActive: { color: COLORS.primary, fontWeight: 'bold' },

    sectionTitle: { color: COLORS.muted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 10, fontWeight: 'bold' },

    kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    kpiCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, paddingVertical: 20, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    kpiValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
    kpiLabel: { color: COLORS.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

    chartContainer: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, paddingVertical: 15, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
    chart: { borderRadius: 16 },

    menuContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 25, padding: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    menuButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 15 },
    menuIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuButtonText: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '600' }
});