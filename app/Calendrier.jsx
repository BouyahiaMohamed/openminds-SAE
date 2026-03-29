import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; // 👈 On importe le router pour la navigation
import { AppBackground } from '../components/ui/UI';

const COLORS = {
    background: '#13142b',
    cardBg: '#1e1f3d',
    text: '#ffffff',
    muted: '#b5b5c3',
    primary: '#56589f',
    accent: '#FF4B4B'
};

// Configuration du calendrier en Français
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim.','Lun.','Mar.','Mer.','Jeu.','Ven.','Sam.']
};
LocaleConfig.defaultLocale = 'fr';

export default function CalendrierScreen() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const sessions = {
    '2024-05-20': { marked: true, dotColor: COLORS.accent, title: 'React Native Expert', hour: '14:00', lieu: 'Paris 20e' },
    '2024-05-22': { marked: true, dotColor: '#4CAF50', title: 'UI/UX Design', hour: '09:30', lieu: 'Distanciel' },
  };

  const handleDayPress = (day) => {
    if (sessions[day.dateString]) {
      setSelectedSession(sessions[day.dateString]);
      setModalVisible(true);
    }
  };

  return (
    <AppBackground>
      <View style={styles.container}>

        {/* EN-TÊTE DE LA PAGE AVEC LE BOUTON RETOUR CORRIGÉ */}
        <View style={styles.headerContainer}>
            {/* 👈 C'EST ICI QUE J'AI CHANGÉ LE LIEN : router.push('/profile') */}
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={26} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Mon Planning</Text>
                <Text style={styles.subtitle}>Retrouvez vos sessions à venir</Text>
            </View>
        </View>

        {/* CARTE DU CALENDRIER */}
        <View style={styles.calendarCard}>
            <Calendar
                enableSwipeMonths={true}
                theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: COLORS.muted,
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: COLORS.accent,
                    dayTextColor: COLORS.text,
                    textDisabledColor: 'rgba(255,255,255,0.2)',
                    dotColor: COLORS.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: COLORS.text,
                    monthTextColor: COLORS.text,
                    textDayFontWeight: '500',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600',
                    textMonthFontSize: 18,
                }}
                markedDates={sessions}
                onDayPress={handleDayPress}
            />
        </View>

        {/* POP-UP (MODAL) */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>

              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>{selectedSession?.title}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeIconBtn}>
                      <Ionicons name="close" size={24} color={COLORS.muted} />
                  </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                  <View style={styles.iconBox}>
                      <Ionicons name="time-outline" size={22} color={COLORS.primary} />
                  </View>
                  <View>
                      <Text style={styles.infoLabel}>Horaire</Text>
                      <Text style={styles.infoText}>{selectedSession?.hour}</Text>
                  </View>
              </View>

              <View style={styles.infoRow}>
                  <View style={styles.iconBox}>
                      <Ionicons name="location-outline" size={22} color={COLORS.accent} />
                  </View>
                  <View>
                      <Text style={styles.infoLabel}>Lieu</Text>
                      <Text style={styles.infoText}>{selectedSession?.lieu}</Text>
                  </View>
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.actionBtnText}>Fermer</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },

  // Header avec bouton retour
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginRight: 15 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 3 },

  // Calendrier
  calendarCard: {
      backgroundColor: COLORS.cardBg,
      borderRadius: 25,
      padding: 10,
      paddingBottom: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10
  },

  // Modale
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
      width: '85%',
      backgroundColor: COLORS.cardBg,
      borderRadius: 25,
      padding: 25,
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, flex: 1, marginRight: 10 },
  closeIconBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 5, borderRadius: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 2 },
  infoText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },

  actionBtn: { marginTop: 10, backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 20, alignItems: 'center' },
  actionBtnText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 }
});