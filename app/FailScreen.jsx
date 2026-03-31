import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../components/ui/UI';
import { COLORS } from '../constants/theme';

export default function FailScreen() {
    const { score, id, titre } = useLocalSearchParams();

    return (
        <AppBackground>
            <SafeAreaView style={styles.container}>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="close-circle" size={100} color="#EF4444" />
                    </View>

                    <Text style={styles.title}>Presque !</Text>

                    <View style={styles.scoreBox}>
                        <Text style={styles.scoreLabel}>Ton score</Text>
                        <Text style={styles.scoreValue}>{score}%</Text>
                    </View>

                    <Text style={styles.message}>
                        Il te faut au moins <Text style={{fontWeight: 'bold', color: COLORS.text}}>80%</Text> pour obtenir le badge de la formation {titre}.
                    </Text>

                    <Text style={styles.subMessage}>
                        Ne te décourage pas, revois tes cours et tente à nouveau ta chance !
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => router.replace({ pathname: '/quiz', params: { id, titre } })}
                    >
                        <Text style={styles.retryBtnText}>Réessayer maintenant</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.replace({
                            pathname: '/FormationDetail',
                            params: { id: id }
                        })}
                    >
                        <Text style={styles.backBtnText}>Retourner à la fiche formation</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 30 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    iconContainer: { marginBottom: 20 },
    title: { color: COLORS.text, fontSize: 32, fontWeight: '900', marginBottom: 20 },
    scoreBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginBottom: 30
    },
    scoreLabel: { color: COLORS.muted, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
    scoreValue: { color: '#EF4444', fontSize: 48, fontWeight: '900' },
    message: { color: COLORS.text, fontSize: 18, textAlign: 'center', lineHeight: 26, marginBottom: 15 },
    subMessage: { color: COLORS.muted, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
    footer: { paddingBottom: 40 },
    retryBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 15,
        boxShadow: '0px 4px 15px rgba(74, 144, 226, 0.3)',
        elevation: 5
    },
    retryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    backBtn: {
        paddingVertical: 15,
        alignItems: 'center'
    },
    backBtnText: { color: COLORS.muted, fontSize: 15, fontWeight: '600' }
});