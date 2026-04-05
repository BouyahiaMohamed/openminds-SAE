import React, { useState } from 'react';
import {
    View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet,
    Switch, ActivityIndicator, Modal, Keyboard, Image, Platform
} from 'react-native';
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

// ─── Dictionnaire de traduction FR → EN (mots courants pour formations) ─────
const FR_EN_DICT = {
    'programmation': 'programming',
    'développement': 'development',
    'developpement': 'development',
    'web': 'web',
    'mobile': 'mobile',
    'design': 'design',
    'graphique': 'graphic',
    'marketing': 'marketing',
    'vente': 'sales',
    'communication': 'communication',
    'management': 'management',
    'leadership': 'leadership',
    'finance': 'finance',
    'comptabilité': 'accounting',
    'comptabilite': 'accounting',
    'ressources humaines': 'human resources',
    'photographie': 'photography',
    'vidéo': 'video',
    'video': 'video',
    'musique': 'music',
    'cuisine': 'cooking',
    'sport': 'sport',
    'yoga': 'yoga',
    'méditation': 'meditation',
    'meditation': 'meditation',
    'intelligence artificielle': 'artificial intelligence',
    'machine learning': 'machine learning',
    'data': 'data',
    'sécurité': 'security',
    'securite': 'security',
    'réseau': 'network',
    'reseau': 'network',
    'cloud': 'cloud',
    'agile': 'agile',
    'scrum': 'scrum',
    'langue': 'language',
    'anglais': 'english',
    'espagnol': 'spanish',
    'allemand': 'german',
    'art': 'art',
    'peinture': 'painting',
    'dessin': 'drawing',
    'architecture': 'architecture',
    'entrepreneuriat': 'entrepreneurship',
    'startup': 'startup',
    'commerce': 'business',
    'droit': 'law',
    'santé': 'health',
    'sante': 'health',
    'médecine': 'medicine',
    'psychologie': 'psychology',
    'formation': 'training',
    'cours': 'course',
    'atelier': 'workshop',
    'conférence': 'conference',
    'conference': 'conference',
    'presentation': 'presentation',
    'présentation': 'presentation',
    'excel': 'excel',
    'powerpoint': 'powerpoint',
    'word': 'word',
    'bureau': 'office',
    'informatique': 'computer',
    'robot': 'robot',
    'électronique': 'electronics',
    'electronique': 'electronics',
    'mécanique': 'mechanics',
    'mecanique': 'mechanics',
    'agriculture': 'agriculture',
    'jardinage': 'gardening',
    'environnement': 'environment',
    'développement personnel': 'personal development',
    'confiance': 'confidence',
    'écriture': 'writing',
    'ecriture': 'writing',
    'lecture': 'reading',
};

/**
 * Traduit un texte FR → EN en utilisant le dictionnaire local.
 * Les mots non reconnus sont conservés tels quels.
 */
const translateToEnglish = (text) => {
    if (!text) return '';
    let result = text.toLowerCase();
    const sortedKeys = Object.keys(FR_EN_DICT).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        result = result.replace(new RegExp(key, 'gi'), FR_EN_DICT[key]);
    }
    return result;
};

export default function AddFormation() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [popup, setPopup] = useState({ visible: false, title: '', message: '', success: false });
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
    const [quiz, setQuiz] = useState([
        { text: '', reponses: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }
    ]);

    const [isImageBankVisible, setIsImageBankVisible] = useState(false);
    const [imageBankQuery, setImageBankQuery] = useState('');
    const [imageBankResults, setImageBankResults] = useState([]);
    const [isSearchingImages, setIsSearchingImages] = useState(false);
    const [imageBankPage, setImageBankPage] = useState(1);
    const [imageBankHasMore, setImageBankHasMore] = useState(false);

    const [isAiModalVisible, setIsAiModalVisible] = useState(false);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [aiStatusText, setAiStatusText] = useState('');

    const [formData, setFormData] = useState({
        Titre: '',
        Description: '',
        isOnline: false,
        Adresse: '',
        Date: '',
        Heure: '09:00',
        nbPlaces: '',
        Formateurs: '',
        URLVideo: '',
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDayPress = (day) => {
        handleChange('Date', day.dateString);
        setIsCalendarVisible(false);
    };

    // ─── Adresse ────────────────────────────────────────────────────────────────

    const searchAddress = async (text) => {
        handleChange('Adresse', text);
        if (text.length > 3) {
            setIsSearchingAddress(true);
            try {
                const response = await fetch(
                    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=5`
                );
                const data = await response.json();
                if (data?.features) {
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

    // ─── Image locale ────────────────────────────────────────────────────────────

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setGeneratedImageUrl(null);
        }
    };

    // ─── Banque d'images Openverse (avec traduction FR→EN) ───────────────────────

    const searchImageBank = async (query, page = 1) => {
        if (query.length < 2) {
            setImageBankResults([]);
            return;
        }
        setIsSearchingImages(true);
        try {
            const englishQuery = translateToEnglish(query);
            const res = await fetch(
                `https://api.openverse.org/v1/images/?q=${encodeURIComponent(englishQuery)}&page_size=20&page=${page}&license_type=commercial`
            );
            const data = await res.json();
            if (data?.results?.length > 0) {
                const mapped = data.results.map((item, i) => ({
                    id: `${page}-${i}-${item.id}`,
                    uri: item.url,
                    thumb: item.thumbnail || item.url,
                }));
                setImageBankResults(prev => page === 1 ? mapped : [...prev, ...mapped]);
                setImageBankHasMore(!!data.next);
                setImageBankPage(page);
            } else {
                if (page === 1) setImageBankResults([]);
                setImageBankHasMore(false);
            }
        } catch (error) {
            console.error('Erreur banque images:', error);
            if (page === 1) setImageBankResults([]);
        } finally {
            setIsSearchingImages(false);
        }
    };

    const handleImageBankSearch = (query) => {
        setImageBankQuery(query);
        searchImageBank(query, 1);
    };

    const loadMoreImages = () => {
        if (!isSearchingImages && imageBankHasMore) {
            searchImageBank(imageBankQuery, imageBankPage + 1);
        }
    };

    const selectBankImage = (uri) => {
        setGeneratedImageUrl(uri);
        setImageUri(null);
        setIsImageBankVisible(false);
        setImageBankResults([]);
        setImageBankQuery('');
    };

    const openImageBank = () => {
        setIsImageBankVisible(true);
        const q = formData.Titre || '';
        setImageBankQuery(q);
        setImageBankResults([]);
        if (q.length >= 2) searchImageBank(q, 1);
    };

    // ─── Génération IA via Pollinations (sans clé API) ───────────────────────────

    const openAiModal = () => {
        if (!formData.Titre) {
            setPopup({
                visible: true,
                title: 'Attention',
                message: 'Veuillez saisir un titre avant de générer une image.',
                success: false
            });
            return;
        }
        setIsAiModalVisible(true);
    };

    /**
     * Génération IA via Pollinations.ai — gratuit, sans clé API.
     * On utilise directement l'URL comme source d'image (pas de FileReader en RN).
     */

    const generatePollinationsImage = async () => {
        setIsAiModalVisible(false);
        setIsGeneratingAi(true);
        setAiStatusText('⏳ L\'IA crée ton image (10-15s)...');

        try {
            const seed = Math.floor(Math.random() * 999999);
            const titleEn = translateToEnglish(formData.Titre);
            const prompt = encodeURIComponent(`${titleEn} professional training course education, clean modern photography`);

            const url = `https://image.pollinations.ai/prompt/${prompt}?width=600&height=400&nologo=true&seed=${seed}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("L'API IA n'a pas répondu correctement.");
            }

            setGeneratedImageUrl(response.url || url);
            setImageUri(null);

        } catch (error) {
            console.error("Erreur IA :", error);
            setGeneratedImageUrl(`https://picsum.photos/seed/${Math.floor(Math.random() * 999)}/600/400`);
            setImageUri(null);
            setPopup({ visible: true, title: 'Oups', message: 'L\'IA est surchargée. Une image de secours a été mise.', success: false });
        } finally {
            setIsGeneratingAi(false);
            setAiStatusText('');
        }
    };

    /**
     * Photo thématique via Openverse
     */
    const generateThematicPhoto = async () => {
        setIsAiModalVisible(false);
        setIsGeneratingAi(true);
        setAiStatusText('🔍 Recherche d\'une photo thématique...');

        try {
            const titleEn = translateToEnglish(formData.Titre);
            const res = await fetch(
                `https://api.openverse.org/v1/images/?q=${encodeURIComponent(titleEn)}&page_size=10&page=1&license_type=commercial`
            );
            const data = await res.json();

            if (data?.results?.length > 0) {
                const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 10));
                const urlImage = data.results[randomIndex].url;

                await Image.prefetch(urlImage);

                setGeneratedImageUrl(urlImage);
                setImageUri(null);
            } else {
                throw new Error("Aucune image trouvée");
            }
        } catch (error) {
            const seed = Math.floor(Math.random() * 999);
            setGeneratedImageUrl(`https://picsum.photos/seed/${seed}/600/400`);
            setImageUri(null);
        } finally {
            setIsGeneratingAi(false);
            setAiStatusText('');
        }
    };

    const addQuestion = () => {
        setQuiz([...quiz, { text: '', reponses: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]);
    };

    const updateQuestionText = (index, text) => {
        const newQuiz = [...quiz];
        newQuiz[index].text = text;
        setQuiz(newQuiz);
    };

    const updateReponseText = (qIndex, rIndex, text) => {
        const newQuiz = [...quiz];
        newQuiz[qIndex].reponses[rIndex].text = text;
        setQuiz(newQuiz);
    };

    const setCorrectReponse = (qIndex, rIndex) => {
        const newQuiz = [...quiz];
        newQuiz[qIndex].reponses.forEach((r, i) => r.isCorrect = i === rIndex);
        setQuiz(newQuiz);
    };

    const addReponse = (qIndex) => {
        const newQuiz = [...quiz];
        newQuiz[qIndex].reponses.push({ text: '', isCorrect: false });
        setQuiz(newQuiz);
    };

    // ─── Soumission ──────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!formData.Titre || !formData.Date && !formData.isOnline) {
            setPopup({ visible: true, title: 'Erreur', message: "Le titre et la date sont requis.", success: false });
            return;
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const payload = new FormData();

            payload.append('Titre', formData.Titre);
            payload.append('Description', formData.Description || '');
            payload.append('isOnline', formData.isOnline ? '1' : '0');
            payload.append('Adresse', formData.isOnline ? '' : formData.Adresse);
            payload.append('URLVideo', formData.isOnline ? formData.URLVideo : '');

            const datePropre = `${formData.Date} ${formData.Heure || '09:00'}:00`;
            payload.append('DateHeure', datePropre);
            payload.append('nbPlacesRestantes', formData.nbPlaces || '0');
            payload.append('quiz', JSON.stringify(quiz));

            // ─── LE CORRECTIF EST ICI ───
            if (imageUri) {
                const filename = imageUri.split('/').pop() || 'photo.jpg';
                payload.append('image', { uri: imageUri, name: filename, type: 'image/jpeg' });
            } else if (generatedImageUrl) {
                payload.append('generatedImage', generatedImageUrl);
            }

            const response = await fetch(`${API_URL}/formations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: payload
            });

            const resData = await response.json();

            if (response.ok) {
                setPopup({ visible: true, title: 'Succès', message: 'Proposition envoyée !', success: true });
            } else {
                throw new Error(resData.details || resData.error || "Erreur serveur");
            }
        } catch (error) {
            setPopup({ visible: true, title: 'Erreur', message: error.message, success: false });
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Rendu ───────────────────────────────────────────────────────────────────

    return (
        <AppBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouvelle Formation</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.infoText}>
                    {"Propose une nouvelle formation ! Elle passera en revue par l'équipe de modération avant d'être publiée."}
                </Text>

                {/* ── IMAGE ── */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Image de la formation</Text>
                    <View style={styles.imageButtonsContainer}>
                        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                            <Ionicons name="image-outline" size={18} color="#FFF" />
                            <Text style={styles.imageBtnText}>Upload</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.imageBtn} onPress={openImageBank}>
                            <Ionicons name="globe-outline" size={18} color="#FFF" />
                            <Text style={styles.imageBtnText}>Parcourir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.imageBtn} onPress={openAiModal} disabled={isGeneratingAi}>
                            {isGeneratingAi
                                ? <ActivityIndicator size="small" color="#FFF" />
                                : <>
                                    <Ionicons name="color-wand-outline" size={18} color="#FFF" />
                                    <Text style={styles.imageBtnText}>IA</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                    {isGeneratingAi && (
                        <Text style={styles.generatingText}>{aiStatusText || '⏳ Génération en cours...'}</Text>
                    )}
                    {(imageUri || generatedImageUrl) && !isGeneratingAi && (
                        <View>
                            <Image
                                source={{ uri: imageUri || generatedImageUrl }}
                                style={styles.imagePreview}
                                onError={() => {
                                    const seed = Math.floor(Math.random() * 999);
                                    setGeneratedImageUrl(`https://picsum.photos/seed/${seed}/600/400`);
                                }}
                            />
                            <TouchableOpacity
                                style={styles.removeImageBtn}
                                onPress={() => { setImageUri(null); setGeneratedImageUrl(null); }}
                            >
                                <Ionicons name="close-circle" size={22} color="#EF4444" />
                                <Text style={styles.removeImageText}>Supprimer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── TITRE ── */}
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

                {/* ── DESCRIPTION ── */}
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

                {/* ── FORMAT ── */}
                <View style={styles.switchGroup}>
                    <View>
                        <Text style={styles.label}>Format du cours</Text>
                        <Text style={styles.subLabel}>{formData.isOnline ? '💻 E-Learning (En ligne)' : '📍 Présentiel (Sur place)'}</Text>
                    </View>
                    <Switch
                        value={formData.isOnline}
                        onValueChange={(val) => { handleChange('isOnline', val); if (val) setAddressSuggestions([]); }}
                        trackColor={{ false: '#3e3e3e', true: COLORS.primary }}
                        thumbColor={formData.isOnline ? '#fff' : '#f4f3f4'}
                    />
                </View>

                {/* ── ADRESSE ── */}
                {!formData.isOnline && (
                    <View style={[styles.formGroup, { zIndex: 10 }]}>
                        <Text style={styles.label}>Adresse du lieu</Text>
                        <View style={[styles.addressInputContainer, { marginBottom: 0 }]}>
                            <TextInput
                                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                                placeholder="Commencez à taper l'adresse..."
                                placeholderTextColor={COLORS.muted}
                                value={formData.Adresse}
                                onChangeText={searchAddress}
                            />
                            {isSearchingAddress && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 15 }} />}
                        </View>
                        {addressSuggestions.length > 0 && (
                            <ScrollView style={styles.suggestionsContainer} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                {addressSuggestions.map((item, index) => (
                                    <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectAddress(item)}>
                                        <Ionicons name="location-outline" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
                                        <Text style={styles.suggestionText} numberOfLines={2}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* ── DATE & HEURE ── */}
                {!formData.isOnline && (
                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>Date *</Text>
                        <TouchableOpacity style={styles.dateSelector} onPress={() => setIsCalendarVisible(true)}>
                            <Ionicons name="calendar-outline" size={20} color={formData.Date ? COLORS.text : COLORS.muted} style={{ marginRight: 10 }} />
                            <Text style={{ color: formData.Date ? COLORS.text : COLORS.muted, fontSize: 15 }}>
                                {formData.Date || "Choisir un jour"}
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
                </View> )}

                {/* ── PLACES ── */}
                {!formData.isOnline && (
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
                </View> )}

                {/* ── FORMATEURS ── */}
                {!formData.isOnline && (
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Intervenant(s)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ton nom ou celui du formateur"
                        placeholderTextColor={COLORS.muted}
                        value={formData.Formateurs}
                        onChangeText={(text) => handleChange('Formateurs', text)}
                    />
                </View> )}
                {/* ── URL VIDÉO (Apparaît seulement si EN LIGNE) ── */}
                {formData.isOnline && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>URL de la vidéo de formation *</Text>
                        <View style={styles.addressInputContainer}>
                            <Ionicons name="logo-youtube" size={20} color="#FF0000" style={{ marginLeft: 15 }} />
                            <TextInput
                                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                                placeholder="Lien YouTube, Vimeo ou MP4..."
                                placeholderTextColor={COLORS.muted}
                                value={formData.URLVideo}
                                onChangeText={(text) => handleChange('URLVideo', text)}
                            />
                        </View>
                    </View>
                )}
                {/* ── SECTION QUIZ ── */}
                <View style={styles.quizSection}>
                    <View style={styles.quizHeaderRow}>
                        <Ionicons name="list-outline" size={20} color={COLORS.primary} />
                        <Text style={[styles.label, { marginBottom: 0, marginLeft: 10 }]}>Configuration du Quiz</Text>
                    </View>

                    {quiz.map((q, qIndex) => (
                        <View key={qIndex} style={styles.quizQuestionCard}>
                            <View style={styles.row}>
                                <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                                {quiz.length > 1 && (
                                    <TouchableOpacity onPress={() => setQuiz(quiz.filter((_, i) => i !== qIndex))}>
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Votre question..."
                                placeholderTextColor={COLORS.muted}
                                value={q.text}
                                onChangeText={(t) => updateQuestionText(qIndex, t)}
                            />

                            <Text style={[styles.label, { fontSize: 12, marginTop: 15 }]}>Réponses (cochez la bonne)</Text>
                            {q.reponses.map((r, rIndex) => (
                                <View key={rIndex} style={styles.reponseRow}>
                                    <TouchableOpacity onPress={() => setCorrectReponse(qIndex, rIndex)}>
                                        <Ionicons
                                            name={r.isCorrect ? "checkmark-circle" : "ellipse-outline"}
                                            size={24}
                                            color={r.isCorrect ? "#4ade80" : COLORS.muted}
                                        />
                                    </TouchableOpacity>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginLeft: 10, paddingVertical: 8 }]}
                                        placeholder={`Réponse ${rIndex + 1}`}
                                        placeholderTextColor={COLORS.muted}
                                        value={r.text}
                                        onChangeText={(t) => updateReponseText(qIndex, rIndex, t)}
                                    />
                                </View>
                            ))}

                            <TouchableOpacity style={styles.addReponseBtn} onPress={() => addReponse(qIndex)}>
                                <Text style={styles.addReponseText}>+ Ajouter une réponse</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
                        <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.addQuestionText}>Ajouter une question</Text>
                    </TouchableOpacity>
                </View>

                {/* ── SUBMIT ── */}
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading
                        ? <ActivityIndicator color="#FFF" />
                        : <>
                            <Ionicons name="paper-plane-outline" size={24} color="#FFF" style={{ marginRight: 10 }} />
                            <Text style={styles.submitBtnText}>Envoyer la proposition</Text>
                        </>
                    }
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ════════════════════════════════════════
                MODAL — CALENDRIER
            ════════════════════════════════════════ */}
            <Modal animationType="fade" transparent visible={isCalendarVisible} onRequestClose={() => setIsCalendarVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModalContent}>
                        <View style={styles.modalHeader}>
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
                            markedDates={formData.Date ? { [formData.Date]: { selected: true, selectedColor: COLORS.primary } } : {}}
                        />
                    </View>
                </View>
            </Modal>

            {/* ════════════════════════════════════════
                MODAL — BANQUE D'IMAGES (Openverse)
            ════════════════════════════════════════ */}
            <Modal animationType="slide" transparent visible={isImageBankVisible} onRequestClose={() => setIsImageBankVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.imageBankModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Parcourir les images</Text>
                            <TouchableOpacity onPress={() => setIsImageBankVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.muted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.bankSubtitle}>
                            Images libres de droits • Recherche traduite automatiquement en anglais 🇬🇧
                        </Text>

                        <View style={styles.addressInputContainer}>
                            <Ionicons name="search-outline" size={18} color={COLORS.muted} style={{ marginLeft: 12 }} />
                            <TextInput
                                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                                placeholder="Ex: programmation, cuisine, sport..."
                                placeholderTextColor={COLORS.muted}
                                value={imageBankQuery}
                                onChangeText={handleImageBankSearch}
                                autoFocus
                                returnKeyType="search"
                                onSubmitEditing={() => searchImageBank(imageBankQuery, 1)}
                            />
                            {isSearchingImages
                                ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 12 }} />
                                : imageBankQuery.length >= 2 && (
                                <TouchableOpacity onPress={() => searchImageBank(imageBankQuery, 1)} style={{ marginRight: 12 }}>
                                    <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                            )
                            }
                        </View>

                        {/* Indication du terme traduit */}
                        {imageBankQuery.length >= 2 && (
                            <Text style={styles.translationHint}>
                                🔍 Recherche : « {translateToEnglish(imageBankQuery)} »
                            </Text>
                        )}

                        <ScrollView
                            contentContainerStyle={styles.imageBankGrid}
                            showsVerticalScrollIndicator={false}
                            onMomentumScrollEnd={({ nativeEvent }) => {
                                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                                if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 50) {
                                    loadMoreImages();
                                }
                            }}
                        >
                            {imageBankResults.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => selectBankImage(item.uri)}
                                    style={styles.imageBankItem}
                                    activeOpacity={0.75}
                                >
                                    <Image
                                        source={{ uri: item.thumb }}
                                        style={styles.imageBankThumb}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}

                            {imageBankResults.length === 0 && !isSearchingImages && (
                                <View style={styles.bankEmptyState}>
                                    <Ionicons name="images-outline" size={48} color={COLORS.muted} />
                                    <Text style={styles.bankEmptyText}>
                                        {imageBankQuery.length < 2
                                            ? 'Saisis un mot-clé pour rechercher des photos'
                                            : 'Aucun résultat. Essaie un autre mot-clé.'}
                                    </Text>
                                </View>
                            )}

                            {imageBankHasMore && !isSearchingImages && imageBankResults.length > 0 && (
                                <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreImages}>
                                    <Text style={styles.loadMoreText}>Charger plus</Text>
                                </TouchableOpacity>
                            )}

                            {isSearchingImages && imageBankResults.length > 0 && (
                                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ════════════════════════════════════════
                MODAL — CHOIX MODE IA
            ════════════════════════════════════════ */}
            <Modal animationType="fade" transparent visible={isAiModalVisible} onRequestClose={() => setIsAiModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.aiChoiceModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Générer une image</Text>
                            <TouchableOpacity onPress={() => setIsAiModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.muted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.aiSubtitle}>Pour {formData.Titre}</Text>

                        <TouchableOpacity style={styles.aiOptionBtn} onPress={generatePollinationsImage}>
                            <View style={styles.aiOptionIcon}>
                                <Ionicons name="sparkles-outline" size={28} color={COLORS.primary} />
                            </View>
                            <View style={styles.aiOptionText}>
                                <Text style={styles.aiOptionTitle}>🤖 Génération IA</Text>
                                <Text style={styles.aiOptionDesc}>Image créée par IA à partir du titre (10–20s)</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                        </TouchableOpacity>

                        <View style={styles.aiDivider} />

                        <TouchableOpacity style={styles.aiOptionBtn} onPress={generateThematicPhoto}>
                            <View style={styles.aiOptionIcon}>
                                <Ionicons name="camera-outline" size={28} color="#4ade80" />
                            </View>
                            <View style={styles.aiOptionText}>
                                <Text style={styles.aiOptionTitle}>📷 Photo thématique</Text>
                                <Text style={styles.aiOptionDesc}>Vraie photo liée au titre, instantanée</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ════════════════════════════════════════
                MODAL — POPUP
            ════════════════════════════════════════ */}
            <Modal animationType="fade" transparent visible={popup.visible}>
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
    infoText: { color: COLORS.text  , fontSize: 14, marginBottom: 25, textAlign: 'center', fontStyle: 'italic', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: 15, borderRadius: 12 },
    formGroup: { marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    subLabel: { color: COLORS.muted, fontSize: 12, marginTop: -4 },
    input: { backgroundColor: 'rgba(255,255,255,0.03)', color: COLORS.text, borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    textArea: { height: 100, textAlignVertical: 'top' },
    switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    addressInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
    suggestionsContainer: { backgroundColor: '#1C1D3B', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxHeight: 150, overflow: 'hidden' },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    suggestionText: { color: COLORS.text, fontSize: 14, flex: 1 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 55 },
    imageButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 8 },
    imageBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    imageBtnText: { color: '#FFF', marginLeft: 6, fontSize: 13 },
    imagePreview: { width: '100%', height: 200, borderRadius: 12, marginTop: 15 },
    generatingText: { color: COLORS.muted, fontSize: 12, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
    removeImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    removeImageText: { color: '#EF4444', fontSize: 13, marginLeft: 4 },
    submitBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    calendarModalContent: { width: '90%', backgroundColor: '#1C1D3B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold' },
    modalMessage: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 25, lineHeight: 20, marginTop: 8 },
    modalBtnOK: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
    modalBtnOKText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    imageBankModal: { width: '95%', height: '85%', backgroundColor: '#1C1D3B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    bankSubtitle: { color: COLORS.muted, fontSize: 12, marginBottom: 12, fontStyle: 'italic' },
    translationHint: { color: COLORS.primary, fontSize: 11, marginBottom: 10, fontStyle: 'italic', opacity: 0.8 },
    imageBankGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    imageBankItem: { width: '48%', marginBottom: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
    imageBankThumb: { width: '100%', height: 110, borderRadius: 10 },
    bankEmptyState: { width: '100%', alignItems: 'center', paddingTop: 40, gap: 12 },
    bankEmptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', maxWidth: 220 },
    loadMoreBtn: { width: '100%', padding: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginTop: 5, marginBottom: 10 },
    loadMoreText: { color: COLORS.primary, fontWeight: 'bold' },
    aiChoiceModal: { width: '88%', backgroundColor: '#1C1D3B', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    aiSubtitle: { color: COLORS.muted, fontSize: 13, marginBottom: 20, fontStyle: 'italic' },
    aiOptionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    aiOptionIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    aiOptionText: { flex: 1 },
    aiOptionTitle: { color: COLORS.text, fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
    aiOptionDesc: { color: COLORS.muted, fontSize: 12, lineHeight: 16 },
    aiDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 6 },
    quizSection: { marginTop: 10, marginBottom: 30 },
    quizHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    quizQuestionCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    questionNumber: { color: COLORS.primary, fontWeight: 'bold', marginBottom: 10 },
    reponseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    addReponseBtn: { alignSelf: 'flex-end', marginTop: 5 },
    addReponseText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
    addQuestionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' },
    addQuestionText: { color: COLORS.primary, fontWeight: 'bold', marginLeft: 8 },
});