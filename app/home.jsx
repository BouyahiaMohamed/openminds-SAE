import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { COLORS } from '../constants/theme';
import { PageTemplate } from '../components/ui/PageTemplate';
import { FormationCard } from '../components/ui/FormationCard';
import { API_URL } from '../config';

export default function HomePage() {
    const TABS = ["Mes Formations", "Favoris ❤️"];
    const [activeTab, setActiveTab] = useState(TABS[0]);

    const [formations, setFormations] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const normalizeString = (str) => {
        if (!str) return '';
        return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const getDynamicImageUrl = (titre, id) => {
        const cleanTitle = normalizeString(titre);
        let category = "education,study";
        if (/jardin|nature|plante|ecolo|vert|terre/i.test(cleanTitle)) category = "nature,garden,plants";
        else if (/carbone|impact|climat|planete/i.test(cleanTitle)) category = "environment,ecology,earth";
        else if (/prejuges|vivre|discrimination|egalite|social/i.test(cleanTitle)) category = "team,people,cooperation";
        else if (/stress|bienetre|sante|mental|zen/i.test(cleanTitle)) category = "wellness,relax,meditation";
        else if (/russe|langue|etranger|vocabulaire|abc/i.test(cleanTitle)) category = "dictionary,language,books";
        else if (/agile|cyber|digital|code|tech|scrum|informatique/i.test(cleanTitle)) category = "technology,computer,code";
        else if (/management|projet|equipe|leadership/i.test(cleanTitle)) category = "business,office,meeting";
        return `https://loremflickr.com/300/300/${category}?lock=${id}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

                // 1. Récupérer les formations (Inscrit)
                const resFormations = await fetch(`${API_URL}/my-formations`, { method: 'GET', headers });
                if (resFormations.ok) {
                    const data = await resFormations.json();
                    const sortedData = data.sort((a, b) => new Date(a.DateHeure) - new Date(b.DateHeure));

                    setFormations(sortedData.map(form => ({
                        ...form,
                        id: form.id_formation,
                        isOnline: !!form.isOnline,
                        image: getDynamicImageUrl(form.Titre, form.id_formation)
                    })));
                }

                // 2. Récupérer les FAVORIS
                const resFavs = await fetch(`${API_URL}/my-favorites`, { method: 'GET', headers });
                if (resFavs.ok) {
                    const data = await resFavs.json();
                    setFavorites(data.map(form => ({
                        ...form,
                        id: form.id,
                        isOnline: !!form.isOnline,
                        image: getDynamicImageUrl(form.Titre, form.id)
                    })));
                }

            } catch (error) {
                console.error("Erreur fetchData:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const presentielCourses = formations.filter(f => !f.isOnline);
    const onlineCourses = formations.filter(f => f.isOnline);

    return (
        <PageTemplate
            title="Mon Apprentissage"
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            bottomNavTab="Menu"
        >
            {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : activeTab === "Favoris ❤️" ? (
                <View style={styles.container}>
                    <Text style={styles.sectionTitle}>Mes coups de cœur</Text>
                    {favorites.length > 0 ? (
                        favorites.map(item => (
                            // 👉 PLUS DE "onPress" ICI, LA CARTE GÈRE LE CLIC !
                            <FormationCard key={`fav-${item.id}`} item={item} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Aucun favori pour le moment.</Text>
                    )}
                </View>
            ) : (
                <View style={styles.container}>
                    <Text style={styles.sectionTitle}>Sessions à venir (Présentiel)</Text>
                    {presentielCourses.length > 0 ? (
                        presentielCourses.map(item => (
                            // 👉 PLUS DE "onPress" ICI NON PLUS !
                            <FormationCard key={`pres-${item.id}`} item={item} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Aucune session physique prévue.</Text>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>E-Learning (Accès illimité)</Text>
                    {onlineCourses.length > 0 ? (
                        onlineCourses.map(item => (
                            // 👉 ET PLUS DE "onPress" ICI !
                            <FormationCard key={`online-${item.id}`} item={item} />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Aucun contenu en ligne pour le moment.</Text>
                    )}

                    <TouchableOpacity style={styles.addButton} onPress={() => router.push('/catalog')}>
                        <Text style={styles.addButtonText}>Explorer le catalogue</Text>
                    </TouchableOpacity>
                </View>
            )}
        </PageTemplate>
    );
}

const styles = StyleSheet.create({
    container: { paddingBottom: 40 },
    sectionTitle: { color: COLORS.muted, fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 10 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginVertical: 20, fontStyle: 'italic', fontSize: 14, backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10 },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 30, opacity: 0.3 },
    addButton: { backgroundColor: COLORS.primary, borderRadius: 15, paddingVertical: 18, alignItems: 'center', marginTop: 40 },
    addButtonText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
});