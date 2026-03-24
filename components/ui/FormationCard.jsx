import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export const FormationCard = ({ item, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.iconContainer}>
                {item.type === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons name={item.icon} size={28} color={COLORS.subtext} />
                ) : (
                    <Ionicons name={item.icon} size={28} color={COLORS.subtext} />
                )}
            </View>

            <View style={styles.cardContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.cardTitle}>{item.Titre}</Text>
                    {item.Statut === 'Téléchargeable' && <Ionicons name="download-outline" size={20} color={COLORS.muted} />}
                </View>

                {item.DateHeure && <Text style={styles.cardTime}>{item.DateHeure}</Text>}

                {item.Progression ? (
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>{Math.round(item.Progression * 100)}%</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${item.Progression * 100}%` }]} />
                        </View>
                    </View>
                ) : (
                    <Text style={[styles.cardStatus, item.Statut === 'En cours' && { color: COLORS.danger }]}>
                        {item.Statut === 'À venir' ? '' : item.Statut}
                    </Text>
                )}
            </View>
            <Text style={styles.voirPlus}>Voir plus...</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 30, padding: 16, flexDirection: 'row', marginBottom: 16, position: 'relative' },
    iconContainer: { width: 50, height: 50, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: 16, backgroundColor: COLORS.iconBG },
    cardContent: { flex: 1, justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    cardTime: { color: COLORS.subtext, fontSize: 12, marginBottom: 4 },
    cardStatus: { color: COLORS.muted, fontSize: 12, fontWeight: '500' },
    progressContainer: { marginTop: 4 },
    progressText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
    progressBarBg: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, width: '70%' },
    progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
    voirPlus: { position: 'absolute', bottom: 16, right: 16, color: COLORS.muted, fontSize: 11 },
});