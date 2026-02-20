import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, FlatList, Keyboard } from 'react-native';
import { useTasks } from '../context/TaskContext';
import { theme } from '../theme';

interface SuggestionInputProps {
  onAddTask: (text: string) => void;
}

export interface SuggestionInputHandle {
    focus: () => void;
}

export const SuggestionInput = forwardRef<SuggestionInputHandle, SuggestionInputProps>(({ onAddTask }, ref) => {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const { getSuggestions, checkDismissedWarning } = useTasks();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = React.useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({
      focus: () => {
          inputRef.current?.focus();
      }
  }));

  useEffect(() => {
    if (text.length > 1) {
        const results = getSuggestions(text);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        
        if (checkDismissedWarning(text)) {
            setWarning("You previously set this on fire. Are you sure?");
        } else {
            setWarning(null);
        }
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setWarning(null);
    }
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAddTask(text);
    setText('');
    setSuggestions([]);
    setShowSuggestions(false);
    setWarning(null);
    Keyboard.dismiss();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onAddTask(suggestion);
    setText('');
    setSuggestions([]);
    setShowSuggestions(false);
    setWarning(null);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Suggestions Popup */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectSuggestion(item)} style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      
      {/* Warning Popup */}
      {warning && (
          <View style={styles.warningContainer}>
              <Text style={styles.warningText}>{warning}</Text>
          </View>
      )}

      {/* Input Field - Retro Line Style */}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder=""
          placeholderTextColor="#999"
          onSubmitEditing={handleSubmit}
        />
        {/* We removed the internal "+" button to use the main Nav bar one, or keep it as "Enter"? 
            Let's keep a small "Enter" arrow if they are typing? 
            Actually, let's keep it purely keyboard driven or via the bottom bar `+`.
            If bottom bar `+` is "Focus", then we need a way to submit. "Enter" key works.
        */}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 10, // Space above nav bar
    backgroundColor: 'transparent',
  },
  inputWrapper: {
      
  },
  input: {
    height: 40,
    fontSize: 18,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    paddingHorizontal: 0,
  },
  startAdornment: {
      fontSize: 18,
      marginRight: 8,
      color: theme.colors.text,
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: 50, // Above input
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: theme.colors.border,
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    fontFamily: theme.fonts.main,
  },
  warningContainer: {
      position: 'absolute',
      bottom: 50,
      left: 20,
      right: 20,
      backgroundColor: theme.colors.warning,
      padding: 8,
      borderWidth: 2,
      borderColor: theme.colors.border,
  },
  warningText: {
      color: theme.colors.text,
      fontFamily: theme.fonts.main,
      fontSize: 12, 
  }
});
