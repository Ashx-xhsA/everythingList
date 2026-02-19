import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, SafeAreaView, Platform, Animated, PanResponder, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTasks } from '../context/TaskContext';
import { Task } from '../types';
import { theme } from '../theme';

export const LogPage = () => {
    const { tasks, deleteTask, fontSize } = useTasks();
    const navigation = useNavigation();
    
    // Default to current month/year
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
    
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const detailTaskRef = useRef<Task | null>(null);

    // Filter completed tasks
    const completedTasks = useMemo(() => {
        return tasks.filter(t => {
            if (t.status !== 'completed' || !t.completedAt) return false;
            const d = new Date(t.completedAt);
            return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        }).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)); // Newest first
    }, [tasks, selectedYear, selectedMonth]);

    // Group by Day
    const groupedTasks = useMemo(() => {
        const groups: { [key: string]: Task[] } = {};
        completedTasks.forEach(t => {
            const d = new Date(t.completedAt!);
            const dateKey = d.toDateString(); // "Fri Feb 19 2026"
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(t);
        });
        return groups;
    }, [completedTasks]);
    
    const renderGroup = ({ item }: { item: string }) => {
        const dateKey = item;
        const tasksInGroup = groupedTasks[dateKey];
        // Parse date for header
        const d = new Date(tasksInGroup[0].completedAt!);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateNum = d.getDate();
        
        return (
            <View style={styles.groupContainer}>
                <View style={styles.dateHeader}>
                    {/* Daygram Style: "17 Tuesday /" */}
                    <Text style={styles.dateDayText}>
                        <Text style={styles.dateNum}>{dateNum} </Text>
                        <Text style={styles.dateName}>{dayName} /</Text>
                    </Text>
                </View>
                {tasksInGroup.map(t => {
                    const timeStr = new Date(t.completedAt!).toLocaleTimeString('en-US', { 
                        hour: 'numeric', minute: '2-digit', hour12: true 
                    }).toLowerCase(); // 4:08pm
                    
                    return (
                        <TouchableOpacity 
                            key={t.id} 
                            style={styles.logItemContainer}
                            onPress={() => {
                                if (t.details || t.text) {
                                    detailTaskRef.current = t;
                                    setShowDetail(true);
                                }
                            }}
                            onLongPress={() => {
                                Alert.alert(
                                    "Delete Log?",
                                    "Are you sure you want to delete this log permanently?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { 
                                            text: "Delete", 
                                            style: "destructive", 
                                            onPress: () => deleteTask(t.id)
                                        }
                                    ]
                                );
                            }}
                            delayLongPress={500}
                        >
                            <Text style={styles.logTime}>{timeStr}</Text>
                            <Text style={[styles.logText, { fontSize }]}>{t.text}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };
    
    const months = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const years = Array.from({length: 5}, (_, i) => now.getFullYear() - 2 + i);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList 
                data={Object.keys(groupedTasks)}
                keyExtractor={item => item}
                renderItem={renderGroup}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No entries for this month.</Text>
                    </View>
                }
            />

            {/* Bottom Footer - Persistent Bar */}
            <View style={styles.bottomSection}>
                 <View style={styles.footer}>
                     {/* Left: Circle Back Button */}
                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtnCircle} />

                     {/* Right: Date Fillers */}
                     <View style={styles.footerRight}>
                         <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
                             <Text style={styles.footerText}>{months[selectedMonth]}</Text>
                         </TouchableOpacity>
                         
                         <Text style={styles.footerSep}> | </Text>
                         
                         <TouchableOpacity onPress={() => setShowYearPicker(true)}>
                             <Text style={styles.footerText}>{selectedYear}</Text>
                         </TouchableOpacity>
 
                         <View style={{width: 10}} />
                         <View style={styles.barBlock} />
                     </View>
                 </View>
            </View>

            {/* Detail Modal */}
            <Modal visible={showDetail} transparent animationType="fade">
                <TouchableOpacity 
                    style={styles.detailOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowDetail(false)}
                >
                    <View style={styles.detailModal}>
                        <Text style={styles.detailTitle}>{detailTaskRef.current?.text}</Text>
                        {detailTaskRef.current?.details ? (
                            <Text style={styles.detailBody}>{detailTaskRef.current.details}</Text>
                        ) : null}
                        {detailTaskRef.current?.completedAt && (
                            <Text style={styles.detailTime}>
                                {new Date(detailTaskRef.current.completedAt).toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                    hour: 'numeric', minute: '2-digit', hour12: true
                                })}
                            </Text>
                        )}
                        <TouchableOpacity 
                            style={styles.detailCloseBtn} 
                            onPress={() => setShowDetail(false)}
                        >
                            <Text style={styles.detailCloseBtnText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Pickers */}
            <Modal visible={showMonthPicker} transparent animationType="fade">
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowMonthPicker(false)}
                >
                    <View 
                        style={styles.modalContent}
                        onStartShouldSetResponder={() => true}
                    >
                        <ScrollView>
                            {months.map((m, i) => (
                                <TouchableOpacity key={m} style={styles.modalItem} onPress={() => {
                                    setSelectedMonth(i);
                                    setShowMonthPicker(false);
                                }}>
                                    <Text style={[styles.modalItemText, i === selectedMonth && styles.selectedText]}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showYearPicker} transparent animationType="fade">
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowYearPicker(false)}
                >
                    <View 
                        style={styles.modalContent}
                        onStartShouldSetResponder={() => true}
                    >
                         {years.map(y => (
                             <TouchableOpacity key={y} style={styles.modalItem} onPress={() => {
                                 setSelectedYear(y);
                                 setShowYearPicker(false);
                             }}>
                                 <Text style={[styles.modalItemText, y === selectedYear && styles.selectedText]}>{y}</Text>
                             </TouchableOpacity>
                         ))}
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    listContent: { padding: 30, paddingBottom: 80 },
    
    logItemContainer: {
        marginBottom: 15,
        backgroundColor: theme.colors.background,
    },
    
    groupContainer: { marginBottom: 30 },
    dateHeader: { marginBottom: 15 },
    dateDayText: { fontFamily: theme.fonts.serif, fontSize: 18, color: '#000' },
    dateNum: { fontWeight: 'bold' },
    dateName: { fontWeight: 'bold' },
    
    logItem: { 
        backgroundColor: theme.colors.background, // Ensure background covers delete button
    },
    logTime: { 
        fontFamily: theme.fonts.serif, 
        fontSize: 14, 
        color: '#555',
        marginBottom: 4
    },
    logText: { 
        fontFamily: theme.fonts.serif, 
        fontSize: 16, 
        color: '#222', 
        lineHeight: 22 
    },
    
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { fontFamily: theme.fonts.serif, color: '#999', fontStyle: 'italic' },
    
    bottomSection: {
        backgroundColor: theme.colors.background,
        paddingBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
    },
    navBtnCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    footerRight: { flexDirection: 'row', alignItems: 'center' },
    barBlock: { width: 5, height: 16, backgroundColor: '#333' },
    footerText: { fontFamily: theme.fonts.main, fontSize: 14, fontWeight: 'bold', color: '#333' },
    footerSep: { fontFamily: theme.fonts.main, fontSize: 14, color: '#999', marginHorizontal: 4 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', maxHeight: '60%' },
    modalItem: { padding: 15, alignItems: 'center' },
    modalItemText: { fontFamily: theme.fonts.serif, fontSize: 18, color: '#333' },
    selectedText: { fontWeight: 'bold', textDecorationLine: 'underline' },
    closeBtn: { marginTop: 20, padding: 15, alignItems: 'center' },
    closeText: { fontFamily: theme.fonts.main, color: '#555' },

    // Detail Modal
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailModal: {
        width: '80%',
        backgroundColor: '#eae9e5',
        borderWidth: 2,
        borderColor: '#222',
        padding: 24,
    },
    detailTitle: {
        fontFamily: theme.fonts.main,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 12,
    },
    detailBody: {
        fontFamily: theme.fonts.serif,
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
        marginBottom: 16,
    },
    detailEmpty: {
        fontFamily: theme.fonts.serif,
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    detailTime: {
        fontFamily: theme.fonts.main,
        fontSize: 12,
        color: '#888',
        marginBottom: 16,
    },
    detailCloseBtn: {
        borderWidth: 2,
        borderColor: '#222',
        paddingVertical: 8,
        paddingHorizontal: 20,
        alignSelf: 'center',
    },
    detailCloseBtnText: {
        fontFamily: theme.fonts.main,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#222',
    },
});
