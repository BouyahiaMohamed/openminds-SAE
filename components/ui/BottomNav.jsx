import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '../../constants/theme';

export const BottomNav = ({ activeTab }) => {
    return (
        <View style={styles.bottomNav}>
            <View style={styles.navContainer}>
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
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        backgroundColor: COLORS.navBg,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        zIndex: 10,
        paddingBottom: Platform.OS === 'ios' ? 45 : 35,
        paddingTop: 15,
    },
    navContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 10,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        minWidth: 90,
    },
    navItemActive: {
        backgroundColor: COLORS.cardBg
    },
    navText: {
        color: COLORS.muted,
        fontSize: 10,
        marginTop: 4
    },
    navTextActive: {
        color: COLORS.text,
        fontSize: 10,
        marginTop: 4,
        fontWeight: 'bold'
    }
});