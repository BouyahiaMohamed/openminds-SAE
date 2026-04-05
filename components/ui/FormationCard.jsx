import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { router } from 'expo-router';

export const FormationCard = ({ item, onPress }) => {

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push({
                pathname: '/FormationDetail',
                params: { id: item.id || item.id_formation, image: item.image }
            });
        }
    };

    let dateAffichee = item.dateLabel || "Date à définir";
    if (item.DateHeure && !item.dateLabel) {
        const d = new Date(item.DateHeure);
        if (!isNaN(d)) {
            const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
            dateAffichee = `${d.getDate()} ${mois[d.getMonth()]} à ${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
        }
    }

    return (
        <TouchableOpacity style={styles.catalogCard} onPress={handlePress} activeOpacity={0.7}>
            <View style={styles.imageContainer}>
                {/* On affiche l'image si elle existe, sinon un fond par défaut */}
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="book-outline" size={30} color="#FFF" />
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.Titre}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.Description || "Retrouvez les détails de votre apprentissage ici."}
                </Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.cardType}>
                        {item.isOnline ? "💻 E-Learning" : `📍 ${dateAffichee}`}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    catalogCard: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 15,
        overflow: 'hidden',
        marginRight: 15,
        backgroundColor: '#2D2E5C'
    },
    cardImage: {
        width: '100%',
        height: '100%'
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)'
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between'
    },
    cardTitle: {
        color: COLORS.text || '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    cardDesc: {
        color: COLORS.muted || '#A1A1AA',
        fontSize: 12,
        lineHeight: 16,
        marginTop: 4
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8
    },
    cardType: {
        color: COLORS.primary || '#4F46E5',
        fontSize: 11,
        fontWeight: 'bold'
    }
});