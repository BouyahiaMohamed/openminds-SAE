import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { PageTemplate } from '../components/ui/PageTemplate';
import { FormationCard } from '../components/ui/FormationCard';

const getNextDays = () => {
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const todayIndex = new Date().getDay();
    return ["Aujourd'hui", jours[(todayIndex + 1) % 7], jours[(todayIndex + 2) % 7], jours[(todayIndex + 3) % 7]];
};

export default function HomePage() {
    const dynamicDays = getNextDays();
    const [activeTab, setActiveTab] = useState(dynamicDays[0]);

    const formations = [
        { id: 1, Titre: "Cours sur le savoir être", DateHeure: "12h00-13h30", Statut: "En cours", icon: "brain", type: "MaterialCommunityIcons" },
        { id: 2, Titre: "Cours de Russe", DateHeure: "14h30-15h30", Statut: "À venir", icon: "translate", type: "MaterialCommunityIcons" },
        { id: 3, Titre: "Gestion de Projet Agile", Progression: 0.32, Statut: "Téléchargeable", icon: "chart-line", type: "MaterialCommunityIcons" },
    ];

    return (
        <PageTemplate
            title={null}
            tabs={dynamicDays}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            bottomNavTab="Menu"
        >
            <Text style={styles.sectionTitle}>Formations</Text>

            {formations.map((item) => (
                <FormationCard
                    key={item.id}
                    item={item}
                    onPress={() => console.log(`Clic sur ${item.Titre}`)}
                />
            ))}

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