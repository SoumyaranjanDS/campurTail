import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';

const AI_STATES = [
  'Uploading photo',
  'Scanning image',
  'Analyzing content',
  'Generating insights',
];

const SUBMIT_STATES = [
  'Submitting report',
  'Saving to server',
  'Almost done',
];

const PulseDot = ({ delay }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });

  return (
    <Animated.View style={[styles.dot, { opacity, transform: [{ scale }] }]} />
  );
};

const ELLIPSIS = ['', '.', '..', '...'];

const FullScreenLoader = ({ visible, text = 'Loading...' }) => {
  const isAI =
    text.toUpperCase().includes('AI') || text.toUpperCase().includes('SCAN');
  const states = isAI ? AI_STATES : SUBMIT_STATES;

  const [statusIndex, setStatusIndex] = useState(0);
  const [ellipsisIndex, setEllipsisIndex] = useState(0);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setStatusIndex(0);
      setEllipsisIndex(0);
      return;
    }

    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    setStatusIndex(0);
    setEllipsisIndex(0);

    const statusInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % states.length);
    }, 1600);

    const ellipsisInterval = setInterval(() => {
      setEllipsisIndex(prev => (prev + 1) % ELLIPSIS.length);
    }, 350);

    return () => {
      clearInterval(statusInterval);
      clearInterval(ellipsisInterval);
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <View style={styles.content}>
          <View style={styles.dotsRow}>
            <PulseDot delay={0} />
            <PulseDot delay={180} />
            <PulseDot delay={360} />
          </View>
          <Text style={styles.statusText}>
            {states[statusIndex]}{ELLIPSIS[ellipsisIndex]}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 23, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 7,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});

export default FullScreenLoader;
