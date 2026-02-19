import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTasks } from '../context/TaskContext';
import { theme } from '../theme';

export const SettingsScreen = () => {
    const navigation = useNavigation();
    const { 
        pageSize, 
        setPageSize, 
        fontSize, 
        setFontSize, 
        resetData 
    } = useTasks();

    const [localPageSize, setLocalPageSize] = useState(pageSize.toString());
    const [localFontSize, setLocalFontSize] = useState(fontSize.toString());

    // Auto-save logic
    const savePageSize = () => {
        const pSize = parseInt(localPageSize, 10);
        if (isNaN(pSize) || pSize < 1) {
            Alert.alert("Invalid input", "Page size must be at least 1.");
            setLocalPageSize(pageSize.toString()); // Revert
            return;
        }
        if (pSize !== pageSize) {
            setPageSize(pSize);
        }
    };

    const saveFontSize = () => {
        const fSize = parseInt(localFontSize, 10);
        if (isNaN(fSize) || fSize < 8 || fSize > 40) {
            Alert.alert("Invalid input", "Font size must be between 8 and 40.");
            setLocalFontSize(fontSize.toString()); // Revert
            return;
        }
        if (fSize !== fontSize) {
            setFontSize(fSize);
        }
    };

    // For buttons (+/-) which update state immediately, we should also trigger save
    // But since they update local state, we can just useEffect or save on press?
    // User requested "save onEndEditing". For +/- buttons, let's just save immediately.
    const adjustFontSize = (delta: number) => {
        const current = parseInt(localFontSize, 10) || 18;
        const newSize = current + delta;
        if (newSize >= 8 && newSize <= 40) {
            setLocalFontSize(newSize.toString());
            setFontSize(newSize);
        }
    };

    const handleReset = () => {
        Alert.alert(
            "Reset All Data?",
            "This will delete ALL tasks and logs, and reset settings to defaults. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "RESET", 
                    style: "destructive", 
                    onPress: () => {
                        resetData();
                        // Reset local state too
                        setLocalPageSize("25");
                        setLocalFontSize("18");
                        Alert.alert("Reset Complete", "All data has been cleared.");
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* No Top Header */}
            
            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Page Size Setting */}
                <View style={styles.section}>
                    <Text style={styles.label}>Items Per Page</Text>
                    <Text style={styles.description}>
                        Number of tasks allowed on a single page. 
                        Note: Decreasing this will close current pages that exceed the limit.
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={localPageSize}
                        onChangeText={setLocalPageSize}
                        onEndEditing={savePageSize}
                        keyboardType="numeric"
                        maxLength={3}
                    />
                </View>

                {/* Font Size Setting */}
                <View style={styles.section}>
                    <Text style={styles.label}>Font Size</Text>
                    <Text style={styles.description}>
                        Size of the text for tasks and logs. (Default: 18)
                    </Text>
                    <View style={styles.row}>
                        <TouchableOpacity 
                            style={styles.adjustBtn} 
                            onPress={() => adjustFontSize(-1)}
                        >
                            <Text style={styles.adjustBtnText}>-</Text>
                        </TouchableOpacity>
                        
                        <TextInput
                            style={[styles.input, styles.fontInput]}
                            value={localFontSize}
                            onChangeText={setLocalFontSize}
                            onEndEditing={saveFontSize}
                            keyboardType="numeric"
                            maxLength={2}
                        />

                        <TouchableOpacity 
                            style={styles.adjustBtn} 
                            onPress={() => adjustFontSize(1)}
                        >
                            <Text style={styles.adjustBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.previewText, { fontSize: parseInt(localFontSize) || 18 }]}>
                        Preview Task Text
                    </Text>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Text style={styles.resetBtnText}>RESET ALL DATA</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomSection}>
                <View style={styles.navBar}>
                    {/* Left: Empty Spacer to match Home Layout */}
                     <View style={{width: 28}} /> 
                    
                    {/* Spacer */}
                    <View style={styles.spacer} />
                    
                    {/* Center Cluster Placeholder (Empty) */}
                    <View style={styles.centerClusterPlaceholder} />

                    {/* Spacer */}
                    <View style={styles.spacer} />
                    
                    {/* Right: Back Button (Wide Rectangle) */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtnSquare} />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    
    content: { padding: 30 },
    section: { marginBottom: 30 },
    label: { fontFamily: theme.fonts.main, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    description: { fontFamily: theme.fonts.serif, fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 20 },
    
    input: {
        borderWidth: 2,
        borderColor: theme.colors.border,
        padding: 15,
        fontSize: 18,
        fontFamily: theme.fonts.main,
        backgroundColor: '#fff',
        textAlign: 'center',
        width: 100,
    },
    
    row: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    fontInput: { width: 60 },
    adjustBtn: {
        width: 40, height: 40,
        backgroundColor: theme.colors.button,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: theme.colors.border,
    },
    adjustBtnText: { fontSize: 20, fontWeight: 'bold' },
    previewText: { marginTop: 15, fontFamily: theme.fonts.serif },
    
    divider: { height: 2, backgroundColor: '#ddd', marginBottom: 30 },
    
    resetBtn: {
        borderWidth: 2,
        borderColor: '#ff3b30',
        padding: 15,
        alignItems: 'center',
    },
    resetBtnText: { color: '#ff3b30', fontSize: 16, fontFamily: theme.fonts.main, fontWeight: 'bold' },

    // Bottom Nav Styles (Copied/Adapted from HomeScreen)
    bottomSection: {
        backgroundColor: theme.colors.background,
        paddingBottom: 10,
    },
    navBar: { 
        flexDirection: 'row', 
        paddingHorizontal: 20, 
        paddingVertical: 10,
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: 70,
    },
    navBtnSquare: {
        width: 40,
        height: 28,
        borderRadius: 0,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    spacer: { flex: 1 },
    centerClusterPlaceholder: {
        width: 140, // Approx width of center cluster
    }
});
