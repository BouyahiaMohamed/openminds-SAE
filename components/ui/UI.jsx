import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export function Input({ label, type = "text", placeholder }) {
    return (
        <View style={{ marginTop: 16, position: 'relative' }}>
            <Text style={{ position: 'absolute', top: -10, left: 16, backgroundColor: COLORS.inputBg, paddingHorizontal: 8, fontSize: 12, color: COLORS.muted, zIndex: 1, fontWeight: '500' }}>
                {label}
            </Text>
            <TextInput
                secureTextEntry={type === 'password'}
                placeholder={placeholder}
                placeholderTextColor={COLORS.border}
                style={{ width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 50, paddingHorizontal: 24, paddingVertical: 16, fontSize: 14, color: COLORS.text }}
            />
        </View>
    );
}

export function PasswordInput({ label, placeholder }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={{ marginTop: 16, position: 'relative' }}>
            <Text style={{ position: 'absolute', top: -10, left: 16, backgroundColor: COLORS.inputBg, paddingHorizontal: 8, fontSize: 12, color: COLORS.muted, zIndex: 1, fontWeight: '500' }}>
                {label}
            </Text>
            <TextInput
                secureTextEntry={!showPassword}
                placeholder={placeholder}
                placeholderTextColor={COLORS.border}
                style={{ width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 50, paddingHorizontal: 24, paddingVertical: 16, paddingRight: 48, fontSize: 14, color: COLORS.text, letterSpacing: showPassword ? 0 : 4 }}
            />
            <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 24, top: 16 }}
            >
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.muted} />
            </TouchableOpacity>
        </View>
    );
}

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
            borderRadius: 22,
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
export function BottomNav({ activeTab }) {
    return (
        <View style={{ backgroundColor: COLORS.navBg, flexDirection: 'row', justifyContent: 'center', gap: 60, alignItems: 'center', paddingHorizontal: 32, paddingTop: 16, paddingBottom: 42, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>

            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, backgroundColor: activeTab === 'Catalogue' ? COLORS.navSelect : 'transparent' }}>
                <Ionicons name="school-outline" size={26} color={COLORS.text} />
                <Text style={{ color: COLORS.text, fontSize: 12, marginTop: 4 }}>Catalogue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, backgroundColor: activeTab === 'Menu' ? COLORS.navSelect : 'transparent' }}>
                <Ionicons name="home" size={26} color={COLORS.text} />
                <Text style={{ color: COLORS.text, fontSize: 12, marginTop: 4 }}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, backgroundColor: activeTab === 'Profile' ? COLORS.navSelect : 'transparent' }}>
                <Ionicons name="person-outline" size={26} color={COLORS.text} />
                <Text style={{ color: COLORS.text, fontSize: 12, marginTop: 4 }}>Profile</Text>
            </TouchableOpacity>

        </View>
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
