import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';
import { PageTemplate } from '../components/ui/PageTemplate';
import { FormationCard } from '../components/ui/FormationCard';
import { API_URL } from '../config';

const getNextDays = () => {
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const todayIndex = new Date().getDay();
    return ["Aujourd'hui", jours[(todayIndex + 1) % 7], jours[(todayIndex + 2) % 7], jours[(todayIndex + 3) % 7]];
};

export default function HomePage() {
    const dynamicDays = getNextDays();
    const [activeTab, setActiveTab] = useState(dynamicDays[0]);
    const [formations, setFormations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFormations = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await fetch(`${API_URL}/my-formations`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    const formattedData = data.map(form => ({
                        ...form,
                        id: form.id_formation,
                        icon: "brain",
                        type: "MaterialCommunityIcons"
                    }));
                    setFormations(formattedData);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFormations();
    }, []);

    return (
        <PageTemplate
            title={null}
            tabs={dynamicDays}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            bottomNavTab="Menu"
        >
            <Text style={styles.sectionTitle}>Formations</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : formations.length > 0 ? (
                formations.map((item) => (
                    <FormationCard
                        key={item.id}
                        item={item}
                        onPress={() => console.log(`Clic sur ${item.Titre}`)}
                    />
                ))
            ) : (
                <Text style={[styles.sectionTitle, { textAlign: 'center', marginTop: 20 }]}>Aucune formation pour le moment.</Text>
            )}

            <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Ajouter une formation</Text>
            </TouchableOpacity>
        </PageTemplate>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: COLORS.muted, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    addButton: { backgroundColor: COLORS.primary, borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 10 },
    addButtonText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
});