import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { COLORS } from '../constants/theme';
import { PageTemplate } from '../components/ui/PageTemplate';
import { FormationCard } from '../components/ui/FormationCard';
import { API_URL } from '../config';

// 👉 Générateur de jours intelligent (qui fait le lien entre l'onglet et la date réelle)
const getNextDaysConfig = () => {
    const tabs = [];
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // Formate la date en YYYY-MM-DD pour filtrer facilement la base de données
        const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');

        let label = "";
        if (i === 0) label = "Aujourd'hui";
        else if (i === 1) label = "Demain";
        else label = jours[d.getDay()];

        tabs.push({ label, date: dateStr });
    }

    // Ajout de l'onglet Favoris à la fin
    tabs.push({ label: "Favoris ❤️", date: "FAVORIS" });
    return tabs;
};

export default function HomePage() {
    const daysConfig = getNextDaysConfig();
    const tabLabels = daysConfig.map(d => d.label); // Ce qu'on envoie au PageTemplate

    const [activeTabLabel, setActiveTabLabel] = useState(tabLabels[0]);
    const [formations, setFormations] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

                // 1. Récupérer les formations en cours
                const resFormations = await fetch(`${API_URL}/my-formations`, { method: 'GET', headers });
                let dataFormations = [];
                if (resFormations.ok) {
                    const data = await resFormations.json();
                    dataFormations = data.map(form => {
                        let dateMatchRaw = "";
                        if (form.DateHeure) {
                            const d = new Date(form.DateHeure);
                            dateMatchRaw = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                        }
                        return {
                            ...form,
                            id: form.id_formation,
                            isOnline: !!form.isOnline,
                            icon: "brain",
                            type: "MaterialCommunityIcons",
                            DateMatchRaw: dateMatchRaw // La date secrète pour le filtre
                        };
                    });
                }

                // 2. Récupérer les favoris
                const resFavs = await fetch(`${API_URL}/my-favorites`, { method: 'GET', headers });
                let dataFavorites = [];
                if (resFavs.ok) {
                    const data = await resFavs.json();
                    dataFavorites = data.map(form => ({
                        ...form,
                        id: form.id,
                        isOnline: !!form.isOnline,
                        icon: "heart",
                        type: "MaterialCommunityIcons"
                    }));
                }

                setFormations(dataFormations);
                setFavorites(dataFavorites);

            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // 👉 Logique de filtrage en fonction de l'onglet sélectionné
    const activeDateConfig = daysConfig.find(d => d.label === activeTabLabel);
    const isFavoris = activeDateConfig?.date === "FAVORIS";
    const activeDateRaw = activeDateConfig?.date;

    // On sépare le présentiel (filtré par jour) de l'e-learning (toujours affiché)
    const presentielCourses = formations.filter(f => !f.isOnline && f.DateMatchRaw === activeDateRaw);
    const onlineCourses = formations.filter(f => f.isOnline);

    return (
        <PageTemplate
            title={null}
            tabs={tabLabels}
            activeTab={activeTabLabel}
            onTabChange={setActiveTabLabel}
            bottomNavTab="Menu" // TA NAVBAR D'ORIGINE !
        >
            {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : isFavoris ? (
                /* SECTION FAVORIS */
                <>
                    <Text style={styles.sectionTitle}>Mes coups de cœur</Text>
                    {favorites.length > 0 ? (
                        favorites.map(item => (
                            <FormationCard key={item.id} item={item} onPress={() => console.log(item.Titre)} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Aucun favori pour le moment.</Text>
                    )}
                </>
            ) : (
                /* SECTION CALENDRIER (Présentiel du jour + E-learning global) */
                <>
                    <Text style={styles.sectionTitle}>
                        Sessions {activeTabLabel === "Aujourd'hui" || activeTabLabel === "Demain" ? activeTabLabel.toLowerCase() : `de ${activeTabLabel.toLowerCase()}`}
                    </Text>

                    {presentielCourses.length > 0 ? (
                        presentielCourses.map(item => (
                            <FormationCard key={item.id} item={item} onPress={() => console.log(item.Titre)} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Aucune session en présentiel prévue ce jour-là.</Text>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>E-Learning (Accès illimité)</Text>
                    {onlineCourses.length > 0 ? (
                        onlineCourses.map(item => (
                            <FormationCard key={`online-${item.id}`} item={item} onPress={() => console.log(item.Titre)} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Vous n'avez aucune formation en ligne en cours.</Text>
                    )}
                </>
            )}

            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/catalog')}>
                <Text style={styles.addButtonText}>Découvrir le catalogue</Text>
            </TouchableOpacity>
        </PageTemplate>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: COLORS.muted, fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 10 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginVertical: 10, fontStyle: 'italic', fontSize: 14 },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 25, opacity: 0.5 },
    addButton: { backgroundColor: COLORS.primary, borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
    addButtonText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
});