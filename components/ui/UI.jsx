import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, SafeAreaView, Platform, StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/theme';

export function AppBackground({ children }) {
    return (
        <LinearGradient colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                {children}
            </SafeAreaView>
        </LinearGradient>
    );
}

export const Input = ({ label, placeholder, value, onChangeText, ...props }) => {
    return (
        <View style={{ marginBottom: 16, position: 'relative', marginTop: 8 }}>
            <View style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 25,
                paddingHorizontal: 20,
                height: 56,
                justifyContent: 'center',
            }}>
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.muted}
                    value={value}
                    onChangeText={onChangeText}
                    style={{ color: COLORS.text, fontSize: 14, flex: 1 }}
                    {...props}
                />
            </View>
            <View style={{
                position: 'absolute',
                top: -10,
                left: 20,
                backgroundColor: COLORS.inputBg,
                paddingHorizontal: 6,
            }}>
                <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500' }}>{label}</Text>
            </View>
        </View>
    );
};

export const PasswordInput = ({ label, placeholder, value, onChangeText, ...props }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={{ marginBottom: 16, position: 'relative', marginTop: 8 }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 25,
                paddingHorizontal: 20,
                height: 56,
            }}>
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.muted}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!isPasswordVisible}
                    style={{ color: COLORS.text, fontSize: 14, flex: 1 }}
                    {...props}
                />
                <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={{ paddingLeft: 10 }}
                >
                    <Ionicons
                        name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={COLORS.muted}
                    />
                </TouchableOpacity>
            </View>
            <View style={{
                position: 'absolute',
                top: -10,
                left: 20,
                backgroundColor: COLORS.inputBg,
                paddingHorizontal: 6,
            }}>
                <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500' }}>{label}</Text>
            </View>
        </View>
    );
};

export function Button({ children, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ width: '100%', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 50, marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 }}
        >
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
                {children}
            </Text>
        </TouchableOpacity>
    );
}

export function SocialButton({ iconName, label }) {
    return (
        <TouchableOpacity style={{
            flex: 1,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 25,
            paddingVertical: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16
        }}>
            <Ionicons name={iconName} size={24} color={COLORS.text}/>
            <Text style={{fontSize: 14, fontWeight: '500', color: COLORS.text, marginLeft: 8}}>{label}</Text>
        </TouchableOpacity>
    );
}


export function SettingCard({ title, subtitle, isLogout, onEdit, onLogout }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBg, padding: 18, borderRadius: 24, marginBottom: 12 }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ color: isLogout ? COLORS.danger : COLORS.text, fontWeight: 'bold', fontSize: 14, marginBottom: subtitle ? 4 : 0 }}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={{ color: COLORS.subtext, fontSize: 13 }} numberOfLines={1}>
                        {subtitle}
                    </Text>
                )}
            </View>

            {isLogout ? (
                <TouchableOpacity onPress={onLogout} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="exit-outline" size={22} color={COLORS.text} />
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={onEdit} style={{ backgroundColor: '#2D2E5C', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 }}>
                    <Text style={{ color: COLORS.subtext, fontSize: 12, fontWeight: '500' }}>Modifier</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export function SettingDropdown({ title, options, initialValue }) {
    const [currentValue, setCurrentValue] = useState(initialValue);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={{ backgroundColor: COLORS.cardBg, borderRadius: 24, marginBottom: 12, overflow: 'hidden' }}>
            <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}
            >
                <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 14 }}>
                        {title}
                    </Text>
                </View>
                <View style={{ backgroundColor: '#2D2E5C', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '500' }}>{currentValue}</Text>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={14} color={COLORS.text} />
                </View>
            </TouchableOpacity>

            {isOpen && (
                <View style={{ paddingHorizontal: 18, paddingBottom: 18, paddingTop: 4, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                setCurrentValue(option);
                                setIsOpen(false);
                            }}
                            style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <Text style={{ color: currentValue === option ? '#38BDF8' : COLORS.subtext, fontSize: 14, fontWeight: currentValue === option ? 'bold' : 'normal' }}>
                                {option}
                            </Text>
                            {currentValue === option && (
                                <Ionicons name="checkmark" size={18} color="#38BDF8" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

// ==========================================
// 2. COMPOSANT : BOTTOM NAVBAR
// ==========================================
export const BottomNav = ({ activeTab }) => {
    const router = useRouter();

    return (
        <View style={styles.bottomNav}>
            <View style={styles.navContainer}>
                {/* BOUTON CATALOGUE */}
                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'Catalogue' && styles.navItemActive]}
                    onPress={() => router.replace('/catalog')}
                >
                    <Ionicons
                        name="school-outline"
                        size={24}
                        color={activeTab === 'Catalogue' ? COLORS.text : COLORS.muted}
                    />
                    <Text style={[styles.navText, activeTab === 'Catalogue' && styles.navTextActive]}>
                        Catalogue
                    </Text>
                </TouchableOpacity>

                {/* BOUTON MENU (DASHBOARD) */}
                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'Menu' && styles.navItemActive]}
                    onPress={() => router.replace('/home')}
                >
                    <Ionicons
                        name="home"
                        size={24}
                        color={activeTab === 'Menu' ? COLORS.text : COLORS.muted}
                    />
                    <Text style={[styles.navText, activeTab === 'Menu' && styles.navTextActive]}>
                        Menu
                    </Text>
                </TouchableOpacity>

                {/* BOUTON PROFILE */}
                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'Profile' && styles.navItemActive]}
                    onPress={() => router.replace('/profile')}
                >
                    <Ionicons
                        name="person-outline"
                        size={24}
                        color={activeTab === 'Profile' ? COLORS.text : COLORS.muted}
                    />
                    <Text style={[styles.navText, activeTab === 'Profile' && styles.navTextActive]}>
                        Profile
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ==========================================
// STYLES GLOBAUX DE L'UI
// ==========================================
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