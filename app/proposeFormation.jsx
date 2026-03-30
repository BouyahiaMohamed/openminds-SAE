import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/ui/UI';
import { COLORS } from '../constants/theme';
import { API_URL } from '../config';

export default function ProposeFormation() {
    const [isLoading, setIsLoading] = useState(false);
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', success: false });

    const [formData, setFormData] = useState({
        Titre: '',
        Description: '',
        isOnline: false,
        Adresse: '',
        DateHeure: '',
        nbPlaces: '',
        Formateurs: ''
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.Titre || !formData.DateHeure) {
            setPopup({ visible: true, title: 'Erreur', message: 'Le titre et la date sont obligatoires.', success: false });
            return;
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            const payload = {
                Titre: formData.Titre,
                Description: formData.Description,
                isOnline: formData.isOnline,
                Adresse: formData.isOnline ? null : formData.Adresse,
                DateHeure: formData.DateHeure,
                nbPlacesRestantes: parseInt(formData.nbPlaces) || 0,
                Formateurs: formData.Formateurs
            };

            const response = await fetch(`${API_URL}/formations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setPopup({
                    visible: true,
                    title: 'Succès',
                    message: 'Ta proposition a été envoyée aux administrateurs pour validation !',
                    success: true
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur lors de la proposition.");
            }
        } catch (error) {
            setPopup({ visible: true, title: 'Erreur', message: error.message, success: false });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Proposer une formation</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                <Text style={styles.infoText}>
                    Partage tes connaissances ! Propose une formation, les administrateurs l'examineront avant de la publier.
                </Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Titre de la formation *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Initiation à React Native"
                        placeholderTextColor={COLORS.muted}
                        value={formData.Titre}
                        onChangeText={(text) => handleChange('Titre', text)}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Détails du programme..."
                        placeholderTextColor={COLORS.muted}
                        multiline
                        numberOfLines={4}
                        value={formData.Description}
                        onChangeText={(text) => handleChange('Description', text)}
                    />
                </View>

                <View style={styles.switchGroup}>
                    <View>
                        <Text style={styles.label}>Formation en ligne ?</Text>
                        <Text style={styles.subLabel}>{formData.isOnline ? 'E-Learning (Pas de lieu)' : 'Présentiel (Nécessite une adresse)'}</Text>
                    </View>
                    <Switch
                        value={formData.isOnline}
                        onValueChange={(val) => handleChange('isOnline', val)}
                        trackColor={{ false: '#3e3e3e', true: COLORS.primary }}
                        thumbColor={formData.isOnline ? '#fff' : '#f4f3f4'}
                    />
                </View>

                {!formData.isOnline && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Adresse du lieu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123 rue de la Paix, Paris"
                            placeholderTextColor={COLORS.muted}
                            value={formData.Adresse}
                            onChangeText={(text) => handleChange('Adresse', text)}
                        />
                    </View>
                )}

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Date et Heure *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD HH:MM"
                            placeholderTextColor={COLORS.muted}
                            value={formData.DateHeure}
                            onChangeText={(text) => handleChange('DateHeure', text)}
                        />
                    </View>

                    <View style={[styles.formGroup, { flex: 0.7 }]}>
                        <Text style={styles.label}>Places dispo.</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 20"
                            placeholderTextColor={COLORS.muted}
                            keyboardType="numeric"
                            value={formData.nbPlaces}
                            onChangeText={(text) => handleChange('nbPlaces', text)}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Intervenant(s)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ton nom ou celui du formateur"
                        placeholderTextColor={COLORS.muted}
                        value={formData.Formateurs}
                        onChangeText={(text) => handleChange('Formateurs', text)}
                    />
                </View>

                <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="paper-plane-outline" size={24} color="#FFF" style={{ marginRight: 10 }} />
                            <Text style={styles.submitBtnText}>Soumettre ma proposition</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>

            <Modal animationType="fade" transparent={true} visible={popup.visible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons
                            name={popup.success ? "checkmark-circle" : "alert-circle"}
                            size={60}
                            color={popup.success ? "#4ade80" : "#EF4444"}
                            style={{ marginBottom: 15 }}
                        />
                        <Text style={styles.modalTitle}>{popup.title}</Text>
                        <Text style={styles.modalMessage}>{popup.message}</Text>
                        <TouchableOpacity
                            style={styles.modalBtnOK}
                            onPress={() => {
                                setPopup({ ...popup, visible: false });
                                if (popup.success) router.back();
                            }}
                        >
                            <Text style={styles.modalBtnOKText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8, zIndex: 1 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginLeft: -40 },
    content: { paddingHorizontal: 20, paddingBottom: 50 },
    infoText: { color: COLORS.primary, fontSize: 14, marginBottom: 25, textAlign: 'center', fontStyle: 'italic' },
    formGroup: { marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    subLabel: { color: COLORS.muted, fontSize: 12, marginTop: -4 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.text, borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    textArea: { height: 100, textAlignVertical: 'top' },
    switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    submitBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center' },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    modalMessage: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 25 },
    modalBtnOK: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
    modalBtnOKText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});