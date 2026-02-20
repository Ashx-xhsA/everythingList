import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Pager, PagerViewHandle } from '../components/Pager'; 
import { useNavigation } from '@react-navigation/native';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from '../components/TaskItem';
import { SuggestionInput, SuggestionInputHandle } from '../components/SuggestionInput';
import { TaskModal } from '../components/TaskModal';
import { Task } from '../types';
import { theme } from '../theme';

export const HomeScreen = () => {
    const { 
        tasks, 
        currentPageIndex, 
        maxPageIndex, 
        addTask,
        completeTask, 
        firePage,
        nextPage,
        goToPage,
        firstActivePageIndex,
        lastActivePageIndex,
        updateTask,
        isPageFull
    } = useTasks();
    
    const navigation = useNavigation();
    const pagerRef = useRef<any>(null);
    // const inputRef = useRef<SuggestionInputHandle>(null); // Removed SuggestionInput

    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const handleAddTask = (text: string, details: string) => {
        if (editingTask) {
            updateTask(editingTask.id, { text, details });
        } else {
            addTask(text, details);
        }
        setEditingTask(null);
    };

    const openCreateModal = () => {
        setEditingTask(null);
        setModalVisible(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setModalVisible(true);
    };

    // Sync Pager with Context
    useEffect(() => {
        pagerRef.current?.setPage(currentPageIndex);
    }, [currentPageIndex]);

    const handleFire = () => {
        Alert.alert(
            "Dismiss Page?",
            "Dismiss all tasks on this page? They will be moved to the graveyard.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "DISMISS", 
                    style: "destructive", 
                    onPress: () => firePage(currentPageIndex) 
                }
            ]
        );
    };

    const renderPage = (pageIndex: number) => {
        const pageTasks = tasks.filter(t => t.pageIndex === pageIndex);
        
        // Sort: Active first, then Completed (newest first)
        const sortedTasks = [...pageTasks].sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (a.status !== 'active' && b.status === 'active') return 1;
            if (a.status !== 'active' && b.status !== 'active') {
                // Both completed/dismissed. Sort by time (descending)
                const timeA = a.completedAt || a.dismissedAt || 0;
                const timeB = b.completedAt || b.dismissedAt || 0;
                return timeB - timeA;
            }
            return 0; // Keep original order for active
        });

        const hasActive = sortedTasks.some(t => t.status === 'active');
        const isFull = isPageFull(pageIndex);
        
        return (
            <ScrollView key={pageIndex} style={styles.pageContainer} contentContainerStyle={styles.pageContent}>
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>PAGE {pageIndex + 1}</Text>
                    {/* Always render container, control visibility with opacity to prevent layout shift */}
                    <View style={{ opacity: (isFull && hasActive) ? 1 : 0 }}>
                        <TouchableOpacity 
                            onPress={handleFire} 
                            style={styles.fireButton}
                            disabled={!(isFull && hasActive)} // Disable touch when hidden
                        >
                            <Text style={styles.fireButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {sortedTasks.length === 0 ? (
                     <View style={styles.emptyState}>
                         <Text style={styles.emptyText}>- Empty Page -</Text>
                     </View>
                ) : (
                    sortedTasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onComplete={() => completeTask(task.id)}
                            onEdit={() => openEditModal(task)}
                        />
                    ))
                )}
            </ScrollView>
        );
    };

    const pages = [];
    for (let i = 0; i <= maxPageIndex; i++) {
        pages.push(renderPage(i));
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardContainer}
            >
                <Pager 
                    style={styles.pagerView} 
                    initialPage={0}
                    ref={pagerRef}
                    onPageSelected={(e: any) => {
                        const page = e.nativeEvent.position;
                        if (page !== currentPageIndex) {
                            goToPage(page);
                        }
                    }}
                >
                    {pages}
                </Pager>

                {/* Retro Bottom Controls */}
                <View style={styles.bottomSection}>
                    {/* Input removed, just spacer */}
                    <View style={{ height: 10 }} />
                    
                    <View style={styles.navBar}>
                        {/* Left: Log Button */}
                        <TouchableOpacity onPress={() => navigation.navigate('Log' as never)} style={styles.navBtnCircle} />
                        
                        {/* Spacer */}
                        <View style={styles.spacer} />
                        
                        {/* Center Cluster */}
                        <View style={styles.centerCluster}>
                            <TouchableOpacity onPress={() => goToPage(firstActivePageIndex)} style={styles.navBtn}>
                                <Text style={styles.navText}>{'<'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => {
                                    if (isPageFull(currentPageIndex)) {
                                       goToPage(maxPageIndex + 1);
                                       // Small delay to let the page transition settle, then open modal
                                       setTimeout(() => openCreateModal(), 200);
                                    } else {
                                       openCreateModal();
                                    }
                                }} 
                                style={styles.navBtnMain}
                            >
                                <Text style={styles.navTextMain}>{'+'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => goToPage(lastActivePageIndex)} style={styles.navBtn}>
                                <Text style={styles.navText}>{'>'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Spacer to balance center */}
                        <View style={styles.spacer} />
                        
                        {/* Right: Settings Button (Square) */}
                        <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)} style={styles.navBtnSquare} />
                    </View>
                </View>
            </KeyboardAvoidingView>
            
            <TaskModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleAddTask}
                initialText={editingTask?.text}
                initialDetails={editingTask?.details}
                mode={editingTask ? 'edit' : 'create'}
                status={editingTask?.status}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    keyboardContainer: { flex: 1 },
    pagerView: { flex: 1 },
    pageContainer: { flex: 1 },
    pageContent: { padding: 20, paddingBottom: 100 }, // Add padding for scrolling
    pageHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.border,
        paddingBottom: 10,
    },
    pageTitle: { 
        fontSize: 24, 
        fontFamily: theme.fonts.main, 
        fontWeight: 'bold', 
        color: theme.colors.text 
    },
    fireButton: { },
    fireButtonText: { fontSize: 26, fontFamily: theme.fonts.main, fontWeight: 'bold', color: theme.colors.text },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { 
        color: theme.colors.textSecondary, 
        fontSize: 18, 
        fontFamily: theme.fonts.main,
        fontStyle: 'italic'
    },
    
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
    centerCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    navBtn: { 
        width: 40, 
        height: 40, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    navBtnCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
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
    navBtnMain: {
        width: 50, 
        height: 50, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    navText: { 
        fontSize: 20, 
        fontFamily: theme.fonts.main, 
        fontWeight: 'bold', 
        color: theme.colors.text 
    },
    navTextMain: { 
        fontSize: 28, 
        fontFamily: theme.fonts.main, 
        fontWeight: 'bold', 
        color: theme.colors.text 
    },
    spacer: { flex: 1 }
});
