import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Modal, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { AppBackground } from '../components/ui/UI';
import { COLORS } from '../constants/theme';
import { API_URL } from '../config';

LocaleConfig.locales['fr'] = {
    monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
    dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
    dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.']
};
LocaleConfig.defaultLocale = 'fr';

export default function AddFormation() {
    const [isLoading, setIsLoading] = useState(false);
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', success: false });

    const [isCalendarVisible, setIsCalendarVisible] = useState(false);

    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);

    const [formData, setFormData] = useState({
        Titre: '',
        Description: '',
        isOnline: false,
        Adresse: '',
        Date: '',
        Heure: '09:00',
        nbPlaces: '',
        Formateurs: ''
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDayPress = (day) => {
        handleChange('Date', day.dateString);
        setIsCalendarVisible(false);
    };

    const searchAddress = async (text) => {
        handleChange('Adresse', text);

        if (text.length > 3) {
            setIsSearchingAddress(true);
            try {
                const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=5`);
                const data = await response.json();

                if (data && data.features) {
                    setAddressSuggestions(data.features.map(f => f.properties.label));
                }
            } catch (error) {
                console.error("Erreur API Adresse :", error);
            } finally {
                setIsSearchingAddress(false);
            }
        } else {
            setAddressSuggestions([]);
        }
    };

    const selectAddress = (address) => {
        handleChange('Adresse', address);
        setAddressSuggestions([]);
        Keyboard.dismiss();
    };

    const handleSubmit = async () => {
        if (!formData.Titre || !formData.Date || !formData.Heure) {
            setPopup({ visible: true, title: 'Erreur', message: 'Le titre, la date et l\'heure sont obligatoires.', success: false });
            return;
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            const payload = {
                Titre: formData.Titre,
                Description: formData.Description,
                isOnline: formData.isOnline ? 1 : 0,
                Adresse: formData.isOnline ? null : formData.Adresse,
                DateHeure: `${formData.Date} ${formData.Heure}:00`,
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

            // CORRECTION DE L'ERREUR JSON ICI 👇
            if (response.ok) {
                setPopup({
                    visible: true,
                    title: 'Succès',
                    message: 'Ta proposition a bien été envoyée. Elle sera visible une fois validée !',
                    success: true
                });
            } else {
                const errorText = await response.text(); // On lit d'abord en texte brut
                try {
                    const errorData = JSON.parse(errorText); // On essaie de convertir en JSON
                    throw new Error(errorData.error || "Erreur lors de l'ajout.");
                } catch (parseError) {
                    // Si ça plante, c'est que c'est du HTML
                    console.error("Le serveur a renvoyé du HTML :", errorText.substring(0, 100));
                    throw new Error("Erreur de route. Le serveur a renvoyé une page (404/500). As-tu bien redémarré le serveur Node ?");
                }
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
                <Text style={styles.headerTitle}>Nouvelle Formation</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                <Text style={styles.infoText}>
                    Propose une nouvelle formation ! Elle passera en revue par l'équipe de modération avant d'être publiée.
                </Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Titre de la formation *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Apprendre React Native"
                        placeholderTextColor={COLORS.muted}
                        value={formData.Titre}
                        onChangeText={(text) => handleChange('Titre', text)}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Détaille le programme ici..."
                        placeholderTextColor={COLORS.muted}
                        multiline
                        numberOfLines={4}
                        value={formData.Description}
                        onChangeText={(text) => handleChange('Description', text)}
                    />
                </View>

                <View style={styles.switchGroup}>
                    <View>
                        <Text style={styles.label}>Format du cours</Text>
                        <Text style={styles.subLabel}>{formData.isOnline ? '💻 E-Learning (En ligne)' : '📍 Présentiel (Sur place)'}</Text>
                    </View>
                    <Switch
                        value={formData.isOnline}
                        onValueChange={(val) => {
                            handleChange('isOnline', val);
                            if (val) setAddressSuggestions([]);
                        }}
                        trackColor={{ false: '#3e3e3e', true: COLORS.primary }}
                        thumbColor={formData.isOnline ? '#fff' : '#f4f3f4'}
                    />
                </View>

                {!formData.isOnline && (
                    <View style={[styles.formGroup, { zIndex: 10 }]}>
                        <Text style={styles.label}>Adresse du lieu</Text>
                        <View style={styles.addressInputContainer}>
                            <TextInput
                                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                                placeholder="Commencez à taper l'adresse..."
                                placeholderTextColor={COLORS.muted}
                                value={formData.Adresse}
                                onChangeText={searchAddress}
                            />
                            {isSearchingAddress && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 15 }} />}
                        </View>

                        {/* CORRECTION DU DÉBORDEMENT ICI 👇 */}
                        {addressSuggestions.length > 0 && (
                            <ScrollView
                                style={styles.suggestionsContainer}
                                nestedScrollEnabled={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                {addressSuggestions.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionItem}
                                        onPress={() => selectAddress(item)}
                                    >
                                        <Ionicons name="location-outline" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
                                        <Text style={styles.suggestionText} numberOfLines={2}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Date *</Text>
                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => setIsCalendarVisible(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={formData.Date ? COLORS.text : COLORS.muted} style={{ marginRight: 10 }} />
                            <Text style={{ color: formData.Date ? COLORS.text : COLORS.muted, fontSize: 15 }}>
                                {formData.Date ? formData.Date : "Choisir un jour"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.formGroup, { flex: 0.6 }]}>
                        <Text style={styles.label}>Heure *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="HH:MM"
                            placeholderTextColor={COLORS.muted}
                            value={formData.Heure}
                            onChangeText={(text) => handleChange('Heure', text)}
                            maxLength={5}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 0.5, marginRight: 10 }]}>
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
                            <Text style={styles.submitBtnText}>Envoyer la proposition</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal animationType="fade" transparent={true} visible={isCalendarVisible} onRequestClose={() => setIsCalendarVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModalContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                            <Text style={styles.modalTitle}>Sélectionner une date</Text>
                            <TouchableOpacity onPress={() => setIsCalendarVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.muted} />
                            </TouchableOpacity>
                        </View>

                        <Calendar
                            minDate={new Date().toISOString().split('T')[0]}
                            onDayPress={handleDayPress}
                            theme={{
                                calendarBackground: '#1C1D3B',
                                textSectionTitleColor: COLORS.muted,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#FF4B4B',
                                dayTextColor: COLORS.text,
                                textDisabledColor: 'rgba(255,255,255,0.2)',
                                monthTextColor: COLORS.text,
                                arrowColor: COLORS.primary,
                            }}
                            markedDates={formData.Date ? {
                                [formData.Date]: { selected: true, selectedColor: COLORS.primary }
                            } : {}}
                        />
                    </View>
                </View>
            </Modal>

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
                            <Text style={styles.modalBtnOKText}>OK, compris</Text>
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
    content: { paddingHorizontal: 20 },

    infoText: { color: COLORS.primary, fontSize: 14, marginBottom: 25, textAlign: 'center', fontStyle: 'italic', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: 15, borderRadius: 12 },

    formGroup: { marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    subLabel: { color: COLORS.muted, fontSize: 12, marginTop: -4 },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', color: COLORS.text, borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    textArea: { height: 100, textAlignVertical: 'top' },

    switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    addressInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    // Modification majeure ici : overflow caché et ScrollView
    suggestionsContainer: { backgroundColor: '#1C1D3B', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxHeight: 150, overflow: 'hidden' },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    suggestionText: { color: COLORS.text, fontSize: 14, flex: 1 },

    dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 55 },

    submitBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    calendarModalContent: { width: '90%', backgroundColor: '#1C1D3B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    modalMessage: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
    modalBtnOK: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
    modalBtnOKText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});