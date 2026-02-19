import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, PanResponder, ScrollView } from 'react-native';
import { theme } from '../theme';
import { TaskStatus } from '../types';

interface TaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (text: string, details: string) => void;
    initialText?: string;
    initialDetails?: string;
    mode: 'create' | 'edit';
    status?: TaskStatus;
}

export const TaskModal: React.FC<TaskModalProps> = ({ 
    visible, 
    onClose, 
    onSave, 
    initialText = '', 
    initialDetails = '',
    mode,
    status
}) => {
    const [text, setText] = useState(initialText);
    const [details, setDetails] = useState(initialDetails);
    const [isEditing, setIsEditing] = useState(mode === 'create');
    const scrollViewRef = useRef<ScrollView>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setText(initialText);
            setDetails(initialDetails);
            // Default to edit mode unless it's a burnt (dismissed) task
            setIsEditing(mode === 'create' || status !== 'dismissed');
        }
    }, [visible, initialText, initialDetails, mode, status]);

    const handleSaveAndClose = () => {
        if (!text.trim()) {
            onClose(); // Discard if empty
            return;
        }
        onSave(text, details);
        onClose();
    };

    const panResponder = React.useMemo(() => 
        PanResponder.create({
            onStartShouldSetPanResponder: () => !isEditing,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return !isEditing && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (isEditing) return;

                if (gestureState.dy > 50) { 
                    // Swipe Down -> Save & Close
                    handleSaveAndClose();
                } else if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
                    // Tap -> Edit Mode (only if not burnt)
                    if (status !== 'dismissed') {
                        setIsEditing(true);
                    }
                }
            }
        }), [isEditing, text, details, status]); // Add dependencies needed inside callbacks

    return (
        <Modal 
            visible={visible} 
            animationType="fade" 
            transparent={false}
            presentationStyle="fullScreen" 
        >
            <SafeAreaView style={styles.container}>
                <View 
                    style={styles.keyboardContainer}
                    {...panResponder.panHandlers}
                >
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{flex: 1}}
                    >
                        <View style={styles.header}>
                            <Text style={styles.title} numberOfLines={1}>
                                {text || (mode === 'create' ? 'New Task' : 'Editing Task')}
                            </Text>
                        </View>

                        <ScrollView 
                            ref={scrollViewRef}
                            style={styles.form} 
                            contentContainerStyle={{flexGrow: 1, paddingBottom: 100}}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.label}>Task Name</Text>
                            <View pointerEvents={isEditing ? 'auto' : 'none'}>
                                <TextInput
                                    style={styles.input}
                                    value={text}
                                    onChangeText={setText}
                                    placeholder="What needs to be done?"
                                    placeholderTextColor="#999"
                                    autoFocus={isEditing && mode === 'create'}
                                    editable={isEditing}
                                />
                            </View>

                            <Text style={styles.label}>Details</Text>
                            <View pointerEvents={isEditing ? 'auto' : 'none'}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={details}
                                    onChangeText={setDetails}
                                    placeholder="Add details..."
                                    placeholderTextColor="#999"
                                    multiline
                                    textAlignVertical="top"
                                    editable={isEditing}
                                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                                    onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                                />
                            </View>
                        </ScrollView>

                        {isEditing && (
                            <View style={styles.footer}>
                                <View style={{flex: 1}} />
                                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.doneButton}>
                                    <Text style={styles.doneText}>| DONE |</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: theme.fonts.main,
        color: theme.colors.text,
    },
    form: {
        padding: 20,
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: 8,
        marginTop: 16,
        fontFamily: theme.fonts.main,
        textTransform: 'uppercase',
    },
    input: {
        fontSize: 18,
        fontFamily: theme.fonts.serif,
        color: theme.colors.text,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingVertical: 8,
        marginBottom: 10,
    },
    textArea: {
        minHeight: 100,
        borderBottomWidth: 0, 
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        paddingBottom: 20,
    },
    doneButton: {
        padding: 10,
    },
    doneText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        fontFamily: theme.fonts.main, // monospace
        letterSpacing: 2,
    },
});
