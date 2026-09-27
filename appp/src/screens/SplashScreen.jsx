import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SplashScreen = () => {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);

    entrance.start();

    return () => entrance.stop();
  }, [fadeAnim, scaleAnim]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.main}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.markContainer}>
            {/* Soft overlapping shapes */}
            <View pointerEvents="none" style={styles.mintShape} />
            <View pointerEvents="none" style={styles.lavenderShape} />

            <View style={styles.iconWrapper}>
              <Activity size={49} color="#6456B8" strokeWidth={1.8} />
            </View>

            <View pointerEvents="none" style={styles.smallDot} />
          </View>

          <Text style={styles.title}>campus pulse</Text>

          <Text style={styles.subtitle}>Your campus. Your voice.</Text>

          <View style={styles.accentRow}>
            <View style={styles.accentDot} />
            <View style={styles.accentPill} />
            <View style={[styles.accentDot, styles.mintDot]} />
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>A better campus starts with us.</Text>
        <View style={styles.footerLine} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    paddingHorizontal: 24,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  markContainer: {
    width: 164,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  mintShape: {
    position: 'absolute',
    width: 102,
    height: 106,
    right: 8,
    top: 28,
    borderRadius: 31,
    backgroundColor: '#E0EDDF',
    transform: [{ rotate: '14deg' }],
  },
  lavenderShape: {
    position: 'absolute',
    width: 105,
    height: 110,
    left: 12,
    top: 11,
    borderRadius: 32,
    backgroundColor: '#E8E0F5',
    transform: [{ rotate: '-12deg' }],
  },
  iconWrapper: {
    width: 100,
    height: 104,
    borderRadius: 29,
    backgroundColor: '#F5F1FC',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    left: 18,
    bottom: 2,
    backgroundColor: '#DCC8A8',
  },
  title: {
    fontSize: 33,
    fontWeight: '600',
    color: '#272D3B',
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#717583',
    marginTop: 10,
    textAlign: 'center',
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 27,
  },
  accentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D7CDE9',
  },
  accentPill: {
    width: 23,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9B89BF',
    marginHorizontal: 7,
  },
  mintDot: {
    backgroundColor: '#A9C5AE',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  footerLine: {
    flex: 1,
    maxWidth: 25,
    height: 1,
    backgroundColor: '#DEDFD9',
  },
  footerText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 18,
    color: '#888D84',
    textAlign: 'center',
    marginHorizontal: 10,
  },
});

export default SplashScreen;
