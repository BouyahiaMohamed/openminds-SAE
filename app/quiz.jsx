import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/ui/UI';
import { API_URL } from '../config';
import { COLORS } from '../constants/theme';

export default function QuizScreen() {
    // --- RÉCUPÉRATION DES PARAMS (ID + TITRE) ---
    const { id, titre } = useLocalSearchParams();

    const [quiz, setQuiz] = useState([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const res = await fetch(`${API_URL}/formations/${id}/quiz`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.error) {
                    Alert.alert("Info", "Aucun quiz n'est encore configuré pour cette formation.");
                    router.back();
                } else {
                    setQuiz(data);
                }
            } catch (error) {
                console.error("Erreur Quiz:", error);
                Alert.alert("Erreur", "Impossible de charger le quiz.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const handleSelect = (questionId, reponseId) => {
        setAnswers({ ...answers, [questionId]: reponseId });
    };

    const progress = quiz.length > 0 ? (Object.keys(answers).length / quiz.length) * 100 : 0;

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.length) {
            Alert.alert("Attention", "Réponds à toutes les questions avant de valider !");
            return;
        }

        setSubmitting(true);
        try {
            let correctCount = 0;
            quiz.forEach(q => {
                const selectedId = answers[q.id];
                const reponseObj = q.reponses.find(r => r.id === selectedId);
                if (reponseObj && reponseObj.isCorrect === 1) correctCount++;
            });

            const finalScore = Math.round((correctCount / quiz.length) * 100);
            const isSuccess = finalScore >= 80 ? 1 : 0;

            const token = await AsyncStorage.getItem('userToken');

            // 1. Enregistrement du score
            await fetch(`${API_URL}/formations/${id}/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ score: finalScore, isSuccess })
            });

            if (isSuccess) {
                // 2. Si succès, on récupère le badge
                const resBadge = await fetch(`${API_URL}/formations/${id}/badge`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const badgeData = await resBadge.json();

                router.replace({
                    pathname: '/SuccessScreen',
                    params: { badge: JSON.stringify(badgeData) }
                });
            } else {
                router.replace({
                    pathname: '/FailScreen',
                    params: {
                        score: finalScore,
                        id: id,
                        titre: titre
                    }
                });
            }
        } catch (error) {
            Alert.alert("Erreur", "Problème lors de la validation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <AppBackground><ActivityIndicator size="large" color={COLORS.primary} style={{flex:1}} /></AppBackground>;

    return (
        <AppBackground>
            {/* --- HEADER AVEC TITRE DYNAMIQUE --- */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={26} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.formationLabel} numberOfLines={1}>
                        Quiz : {titre || "Formation"}
                    </Text>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                </View>

                <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>{Object.keys(answers).length}/{quiz.length}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {quiz.map((q, index) => (
                    <View key={q.id} style={styles.questionCard}>
                        <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
                        <View style={styles.optionsContainer}>
                            {q.reponses.map(rep => {
                                const isSelected = answers[q.id] === rep.id;
                                return (
                                    <TouchableOpacity
                                        key={rep.id}
                                        style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                                        onPress={() => handleSelect(q.id, rep.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                            {rep.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={[styles.submitBtn, Object.keys(answers).length < quiz.length && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Valider mes réponses</Text>}
                </TouchableOpacity>
            </ScrollView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        gap: 12
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1, alignItems: 'center' },
    formationLabel: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    progressContainer: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressBar: { height: '100%', backgroundColor: COLORS.primary },
    counterBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    counterText: { color: COLORS.text, fontSize: 12, fontWeight: 'bold' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
    mainTitle: { color: COLORS.text, fontSize: 26, fontWeight: '800', marginBottom: 25 },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary
    },
    questionText: { color: COLORS.text, fontSize: 17, fontWeight: '600', marginBottom: 20, lineHeight: 24 },
    optionsContainer: { gap: 12 },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    optionBtnSelected: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(74, 144, 226, 0.12)'
    },
    optionText: { color: COLORS.muted, fontSize: 15, marginLeft: 14, flex: 1 },
    optionTextSelected: { color: COLORS.text, fontWeight: 'bold' },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.muted, justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: COLORS.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 18,
        paddingVertical: 20,
        alignItems: 'center',
        marginTop: 10,
        boxShadow: '0px 10px 20px rgba(74, 144, 226, 0.25)',
        elevation: 8
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});