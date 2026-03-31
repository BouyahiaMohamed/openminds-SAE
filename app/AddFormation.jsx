import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Modal, Keyboard, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
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
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingIA, setIsGeneratingIA] = useState(false); // AJOUT : État chargement IA
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', success: false });
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

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
                console.error(error);
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

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setGeneratedImageUrl(null);
            setIsGeneratingIA(false); // Reset IA si on upload
        }
    };

    // CORRECTION IA : Ajout d'un seed pour forcer le rafraîchissement
    const generateRandomImage = () => {
        if (!formData.Titre) {
            setPopup({ visible: true, title: 'Attention', message: 'Veuillez saisir un titre pour générer une image correspondante.', success: false });
            return;
        }
        setIsGeneratingIA(true);
        const seed = Math.floor(Math.random() * 1000000);
        const prompt = encodeURIComponent(formData.Titre + " professional photography high quality");
        setGeneratedImageUrl(`https://image.pollinations.ai/prompt/${prompt}?width=600&height=400&nologo=true&seed=${seed}`);
        setImageUri(null);
    };

    const handleSubmit = async () => {
        if (!formData.Titre || !formData.Date || !formData.Heure) {
            setPopup({ visible: true, title: 'Erreur', message: 'Le titre, la date et l\'heure sont obligatoires.', success: false });
            return;
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            let payload = new FormData();
            payload.append('Titre', formData.Titre);
            payload.append('Description', formData.Description);
            payload.append('isOnline', formData.isOnline ? '1' : '0');
            payload.append('Adresse', formData.isOnline ? '' : formData.Adresse);
            payload.append('DateHeure', `${formData.Date} ${formData.Heure}:00`);
            payload.append('nbPlacesRestantes', formData.nbPlaces || '0');
            payload.append('Formateurs', formData.Formateurs);

            if (imageUri) {
                let filename = imageUri.split('/').pop() || 'photo.jpg';
                let match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image/jpeg`;
                payload.append('image', { uri: imageUri, name: filename, type: type });
            } else if (generatedImageUrl) {
                payload.append('generatedImage', generatedImageUrl);
            }

            const response = await fetch(`${API_URL}/formations`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: payload
            });

            if (response.ok) {
                setPopup({ visible: true, title: 'Succès', message: 'Ta proposition a bien été envoyée !', success: true });
            } else {
                throw new Error("Erreur lors de l'ajout.");
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
                <Text style={styles.infoText}>Propose une nouvelle formation ! Elle sera revue par l'équipe avant d'être publiée.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Image de la formation</Text>
                    <View style={styles.imageButtonsContainer}>
                        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                            <Ionicons name="image-outline" size={20} color="#FFF" />
                            <Text style={styles.imageBtnText}>Upload Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.imageBtn} onPress={generateRandomImage}>
                            <Ionicons name="color-wand-outline" size={20} color="#FFF" />
                            <Text style={styles.imageBtnText}>Générer par IA</Text>
                        </TouchableOpacity>
                    </View>

                    {(imageUri || generatedImageUrl) && (
                        <View style={{ position: 'relative', marginTop: 15 }}>
                            <Image
                                source={{ uri: imageUri || generatedImageUrl }}
                                style={styles.imagePreview}
                                onLoadEnd={() => setIsGeneratingIA(false)}
                            />
                            {isGeneratingIA && (
                                <View style={[styles.imagePreview, { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={{ color: '#FFF', marginTop: 10, fontSize: 12 }}>Génération de l'image...</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Titre de la formation *</Text>
                    <TextInput style={styles.input} placeholder="Ex: Apprendre React Native" placeholderTextColor={COLORS.muted} value={formData.Titre} onChangeText={(t) => handleChange('Titre', t)} />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput style={[styles.input, styles.textArea]} placeholder="Détails..." placeholderTextColor={COLORS.muted} multiline value={formData.Description} onChangeText={(t) => handleChange('Description', t)} />
                </View>

                <View style={styles.switchGroup}>
                    <View>
                        <Text style={styles.label}>Format du cours</Text>
                        <Text style={styles.subLabel}>{formData.isOnline ? '💻 E-Learning' : '📍 Présentiel'}</Text>
                    </View>
                    <Switch value={formData.isOnline} onValueChange={(val) => handleChange('isOnline', val)} trackColor={{ false: '#3e3e3e', true: COLORS.primary }} />
                </View>

                {!formData.isOnline && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Adresse du lieu</Text>
                        <View style={styles.addressInputContainer}>
                            <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]} placeholder="Adresse..." placeholderTextColor={COLORS.muted} value={formData.Adresse} onChangeText={searchAddress} />
                            {isSearchingAddress && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 15 }} />}
                        </View>
                        {addressSuggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {addressSuggestions.map((item, i) => (
                                    <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => selectAddress(item)}>
                                        <Text style={styles.suggestionText}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Date *</Text>
                        <TouchableOpacity style={styles.dateSelector} onPress={() => setIsCalendarVisible(true)}>
                            <Ionicons name="calendar-outline" size={20} color={formData.Date ? COLORS.text : COLORS.muted} style={{ marginRight: 10 }} />
                            <Text style={{ color: formData.Date ? COLORS.text : COLORS.muted }}>{formData.Date || "Choisir"}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.formGroup, { flex: 0.6 }]}>
                        <Text style={styles.label}>Heure *</Text>
                        <TextInput style={styles.input} placeholder="09:00" placeholderTextColor={COLORS.muted} value={formData.Heure} onChangeText={(t) => handleChange('Heure', t)} maxLength={5} />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Places & Intervenants</Text>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, {flex: 0.4, marginRight: 10}]} placeholder="Places" placeholderTextColor={COLORS.muted} keyboardType="numeric" value={formData.nbPlaces} onChangeText={(t) => handleChange('nbPlaces', t)} />
                        <TextInput style={[styles.input, {flex: 1}]} placeholder="Formateur" placeholderTextColor={COLORS.muted} value={formData.Formateurs} onChangeText={(t) => handleChange('Formateurs', t)} />
                    </View>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Envoyer la proposition</Text>}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal animationType="fade" transparent visible={isCalendarVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModalContent}>
                        <Calendar minDate={new Date().toISOString().split('T')[0]} onDayPress={handleDayPress} theme={{ calendarBackground: '#1C1D3B', dayTextColor: '#FFF', todayTextColor: '#FF4B4B', arrowColor: COLORS.primary }} />
                        <TouchableOpacity onPress={() => setIsCalendarVisible(false)} style={{ marginTop: 15, alignItems: 'center' }}><Text style={{ color: COLORS.primary }}>ANNULER</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal animationType="fade" transparent visible={popup.visible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Ionicons name={popup.success ? "checkmark-circle" : "alert-circle"} size={60} color={popup.success ? "#4ade80" : "#EF4444"} />
                        <Text style={styles.modalTitle}>{popup.title}</Text>
                        <Text style={styles.modalMessage}>{popup.message}</Text>
                        <TouchableOpacity style={styles.modalBtnOK} onPress={() => { setPopup({ ...popup, visible: false }); if (popup.success) router.back(); }}>
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
    backBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginRight: 40 },
    content: { paddingHorizontal: 20 },
    infoText: { color: COLORS.primary, fontSize: 13, marginBottom: 25, textAlign: 'center', fontStyle: 'italic', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: 12, borderRadius: 10 },
    formGroup: { marginBottom: 20 },
    label: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    subLabel: { color: COLORS.muted, fontSize: 12, marginTop: -4 },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', color: COLORS.text, borderRadius: 12, padding: 15, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    textArea: { height: 100, textAlignVertical: 'top' },
    switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12 },
    addressInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    suggestionsContainer: { backgroundColor: '#1C1D3B', borderRadius: 12, marginTop: 5, padding: 5 },
    suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    suggestionText: { color: COLORS.text, fontSize: 13 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    imageButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    imageBtn: { flex: 0.48, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    imageBtnText: { color: '#FFF', marginLeft: 8, fontSize: 12 },
    imagePreview: { width: '100%', height: 180, borderRadius: 12 },
    submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center' },
    calendarModalContent: { width: '90%', backgroundColor: '#1C1D3B', borderRadius: 20, padding: 20 },
    modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
    modalMessage: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 20 },
    modalBtnOK: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10 },
    modalBtnOKText: { color: '#FFF', fontWeight: 'bold' }
});