import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { AppBackground } from './UI';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';

export const PageTemplate = ({
                                 title,
                                 settingsAction = () => router.push('/settings'),
                                 tabs = [],
                                 activeTab,
                                 onTabChange,
                                 children,
                                 bottomNavTab
                             }) => {
    const { user } = useAuth();

    const displayTitle = title ? title : `Bonjour, ${user?.username || 'Utilisateur'} !`;

    return (
        <AppBackground>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{displayTitle}</Text>
                <TouchableOpacity onPress={settingsAction} style={styles.settingsBtn}>
                    <Ionicons name="settings-outline" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {tabs.length > 0 && (
                <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity key={tab} onPress={() => onTabChange(tab)} style={styles.tab}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            {activeTab === tab && <View style={styles.activeTabIndicator} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.mainContainer}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {children}
                </ScrollView>
            </View>

            <BottomNav activeTab={bottomNavTab} />
        </AppBackground>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingTop: 80, paddingBottom: 20, position: 'relative' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, flex: 1, textAlign: 'center' },
    settingsBtn: { position: 'absolute', right: 24, top: 80 },

    tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 15 },
    tab: { alignItems: 'center', paddingBottom: 8 },
    tabText: { color: COLORS.notSelected, fontSize: 13, fontWeight: '600' },
    activeTabText: { color: COLORS.selected, fontWeight: 'bold' },
    activeTabIndicator: { position: 'absolute', bottom: 0, width: '100%', height: 3, backgroundColor: COLORS.selected, borderRadius: 2 },

    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.sectionBg,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderColor: COLORS.border,
        overflow: 'hidden'
    },
    scrollContent: { padding: 24, paddingBottom: 100 },
});