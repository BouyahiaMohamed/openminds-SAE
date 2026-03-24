import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { COLORS } from "../constants/theme";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";

export default function Layout() {
    return (
        <AuthProvider>
            <ThemeProvider value={DarkTheme}>
                <View style={{ flex: 1, backgroundColor: COLORS.bgGradientEnd }}>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            animation: 'fade',
                            contentStyle: { backgroundColor: 'transparent' }
                        }}
                    />
                </View>
            </ThemeProvider>
        </AuthProvider>
    );
}