import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../types';
import { theme } from '../theme';

interface TaskItemProps {
  task: Task;
  onComplete: () => void;
  onEdit: () => void;
}

import { useTasks } from '../context/TaskContext';

export const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onEdit }) => {
  const { fontSize } = useTasks();
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = () => {
    setIsExpanded(!isExpanded);
  };
  return (
    <TouchableOpacity 
        style={[
            styles.container, 
            task.status === 'dismissed' && styles.dismissedContainer
        ]}
        onPress={handlePress}
        onLongPress={onEdit}
        delayLongPress={500}
        activeOpacity={0.7}
    >
        {task.status === 'active' && (
            <TouchableOpacity onPress={onComplete} style={styles.button}>
            <View style={[styles.checkBox, { width: fontSize * 1.1, height: fontSize * 1.1 }]} />
            </TouchableOpacity>
        )}

        <View style={styles.textContainer}>
            <Text style={[
                styles.text,
                { fontSize },
                task.status === 'completed' && styles.completedText,
                task.status === 'dismissed' && styles.dismissedText
            ]}>
                {task.text}
            </Text>
            {isExpanded && task.details ? (
                <Text style={styles.detailsText} numberOfLines={3}>{task.details}</Text>
            ) : null}
        </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    marginBottom: 2,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 10,
  },
  text: {
    fontSize: 18,
    // flex: 1, // Moving flex to container
    fontFamily: theme.fonts.main, // Courier
    color: theme.colors.text,
  },
  completedText: {
    textDecorationLine: 'line-through',
    textDecorationColor: theme.colors.text, // Uses the Retro Orange / Fire color
    color: theme.colors.text, // Keep text black
  },
  dismissedText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  detailsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.main,
    marginTop: 4,
  },
  button: {
    padding: 4,
    marginTop: 2,
  },
  checkBox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 0,
  },
  dismissedContainer: {
      backgroundColor: '#e0e0e0', // Light grey background (was light red)
  }
});
