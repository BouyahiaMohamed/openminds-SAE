import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';

export const BottomNav = ({ activeTab }) => {
    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity style={[styles.navItem, activeTab === 'Catalogue' && styles.navItemActive]} onPress={() => router.replace('/catalog')}>
                <Ionicons name="school-outline" size={24} color={activeTab === 'Catalogue' ? COLORS.text : COLORS.muted} />
                <Text style={[styles.navText, activeTab === 'Catalogue' && styles.navTextActive]}>Catalogue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navItem, activeTab === 'Menu' && styles.navItemActive]} onPress={() => router.replace('/home')}>
                <Ionicons name="home" size={24} color={activeTab === 'Menu' ? COLORS.text : COLORS.muted} />
                <Text style={[styles.navText, activeTab === 'Menu' && styles.navTextActive]}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navItem, activeTab === 'Profile' && styles.navItemActive]} onPress={() => router.replace('/settings')}>
                <Ionicons name="person-outline" size={24} color={activeTab === 'Profile' ? COLORS.text : COLORS.muted} />
                <Text style={[styles.navText, activeTab === 'Profile' && styles.navTextActive]}>Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.navBg, position: 'absolute', bottom: 0, width: '100%', zIndex: 10 },
    navItem: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    navItemActive: { backgroundColor: COLORS.cardBg },
    navText: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
    navTextActive: { color: COLORS.text, fontSize: 10, marginTop: 4, fontWeight: 'bold' }
});