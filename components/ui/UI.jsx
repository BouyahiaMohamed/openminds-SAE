import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Input({ label, type = "text", placeholder }) {
    return (
        <View style={{ marginTop: 16, position: 'relative' }}>
            <Text style={{ position: 'absolute', top: -10, left: 16, backgroundColor: '#13132C', paddingHorizontal: 8, fontSize: 12, color: '#9CA3AF', zIndex: 1, fontWeight: '500' }}>
                {label}
            </Text>
            <TextInput
                secureTextEntry={type === 'password'}
                placeholder={placeholder}
                placeholderTextColor="#4B5563"
                style={{ width: '100%', borderWidth: 1, borderColor: '#4B5563', borderRadius: 50, paddingHorizontal: 24, paddingVertical: 16, fontSize: 14, color: 'white' }}
            />
        </View>
    );
}

export function PasswordInput({ label, placeholder }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={{ marginTop: 16, position: 'relative' }}>
            <Text style={{ position: 'absolute', top: -10, left: 16, backgroundColor: '#13132C', paddingHorizontal: 8, fontSize: 12, color: '#9CA3AF', zIndex: 1, fontWeight: '500' }}>
                {label}
            </Text>
            <TextInput
                secureTextEntry={!showPassword}
                placeholder={placeholder}
                placeholderTextColor="#4B5563"
                style={{ width: '100%', borderWidth: 1, borderColor: '#4B5563', borderRadius: 50, paddingHorizontal: 24, paddingVertical: 16, paddingRight: 48, fontSize: 14, color: 'white', letterSpacing: showPassword ? 0 : 4 }}
            />
            <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 24, top: 16 }}
            >
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
            </TouchableOpacity>
        </View>
    );
}

export function Button({ children, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ width: '100%', backgroundColor: '#5014FF', paddingVertical: 16, borderRadius: 50, marginTop: 8, shadowColor: '#5014FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 5 }}
        >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
                {children}
            </Text>
        </TouchableOpacity>
    );
}

export function SocialButton({ iconName, label }) {
    return (
        <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: '#4B5563', borderRadius: 22, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <Ionicons name={iconName} size={24} color="white" />
            <Text style={{ fontSize: 14, fontWeight: '500', color: 'white', marginLeft: 8 }}>{label}</Text>
        </TouchableOpacity>
    );
}