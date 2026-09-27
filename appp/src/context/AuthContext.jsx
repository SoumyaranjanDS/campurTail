import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { Alert } from 'react-native';

const API = 'https://tails.inkedfact.online/api/v1';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const setupFCM = async (token, isLogin = false) => {
    try {
      // Lazy require so Metro doesn't crash if native module isn't compiled yet
      const messaging = require('@react-native-firebase/messaging').default;
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          // Send to backend
          await axios.post(
            `${API}/auth/fcm-token`,
            { fcmToken, isLogin },
            { headers: { Authorization: `Bearer ${token}` } },
          );
        }
        // Subscribe to campus_alerts topic
        await messaging().subscribeToTopic('campus_alerts');
      }
    } catch (e) {
      console.log('Error setting up FCM:', e);
    }
  };

  const login = async (token, user) => {
    setUserToken(token);
    setUserData(user);
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    setupFCM(token, true);
  };

  const logout = async () => {
    setUserToken(null);
    setUserData(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('userData');
      if (token && user) {
        setUserToken(token);
        setUserData(JSON.parse(user));
        // setIsLoading FIRST so the app never gets stuck,
        // then kick off FCM in the background
        setIsLoading(false);
        setupFCM(token);
        return;
      }
    } catch (e) {
      console.log('Error checking token', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{ login, logout, userToken, userData, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
