import React, { createContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    type: 'info', // 'success', 'error', 'info'
    onConfirm: null,
  });
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const showAlert = (title, message, type = null, onConfirm = null) => {
    let alertType = type;
    if (!alertType) {
      const lowerTitle = title ? title.toLowerCase() : '';
      if (lowerTitle.includes('success')) alertType = 'success';
      else if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('denied')) alertType = 'error';
      else alertType = 'info';
    }
    setConfig({ title, message, type: alertType, onConfirm });
    setVisible(true);
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (config.onConfirm) {
        config.onConfirm();
      }
    });
  };

  const getIcon = () => {
    switch (config.type) {
      case 'success':
        return <CheckCircle2 size={40} color="#10B981" />;
      case 'error':
        return <AlertCircle size={40} color="#EF4444" />;
      case 'info':
      default:
        return <Info size={40} color="#3B82F6" />;
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal transparent visible={visible} animationType="fade" onRequestClose={hideAlert}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.message}>{config.message}</Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={hideAlert}>
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCCCCC',
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#007AFF', // Standard iOS blue
    fontSize: 17,
    fontWeight: '600',
  },
});
