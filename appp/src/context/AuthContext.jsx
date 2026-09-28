import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { handleNotificationRoute } from '../navigation/NavigationService';
import axios from 'axios';
import { Alert } from 'react-native';

const API = API_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const setupFCM = async (token, isLogin = false) => {
    try {
      const { getMessaging, requestPermission, getToken, subscribeToTopic } = require('@react-native-firebase/messaging');
      const messagingInstance = getMessaging();
      
      const authStatus = await requestPermission(messagingInstance);
      // AUTHORIZED is 1, PROVISIONAL is 2 in AuthorizationStatus
      const enabled = authStatus === 1 || authStatus === 2;

      if (!enabled) {
        console.log('FCM Permission not granted');
        return;
      }

      const fcmToken = await getToken(messagingInstance);
      if (!fcmToken) {
        console.log('Failed to generate FCM token');
        return;
      }

      // Send to backend
      try {
        await axios.post(
          `${API}/auth/fcm-token`,
          { fcmToken, isLogin },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (postError) {
        console.log(`Failed to send to backend: ${postError.message}`);
      }

      // Subscribe to campus_alerts topic
      await subscribeToTopic(messagingInstance, 'campus_alerts');
      
    
      // Listen for foreground clicks (Notifee)
      const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS && detail.notification && detail.notification.data) {
          handleNotificationRoute(detail.notification.data);
        }
      });

      // Listen for background clicks (FCM)
      const unsubscribeOnOpen = messagingInstance.onNotificationOpenedApp(remoteMessage => {
        if (remoteMessage && remoteMessage.data) {
          handleNotificationRoute(remoteMessage.data);
        }
      });

      // Check if app was opened from a closed state via FCM
      messagingInstance.getInitialNotification().then(remoteMessage => {
        if (remoteMessage && remoteMessage.data) {
          setTimeout(() => {
            handleNotificationRoute(remoteMessage.data);
          }, 1500); // Small delay to let navigation tree mount
        }
      });

    } catch (e) {
      console.log('Error setting up FCM:', e);
      Alert.alert('FCM Error', String(e));
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

    let unsubscribe;
    try {
      const { getMessaging, onMessage } = require('@react-native-firebase/messaging');
      const messagingInstance = getMessaging();
      
      unsubscribe = onMessage(messagingInstance, async remoteMessage => {
        try {
          if (notifee && notifee.requestPermission) {
            await notifee.requestPermission();
            
            const channelId = await notifee.createChannel({
              id: 'default',
              name: 'Campus Tails',
              importance: AndroidImportance.HIGH,
            });

            await notifee.displayNotification({
              title: remoteMessage.notification?.title || 'Campus Tails',
              body: remoteMessage.notification?.body || '',
              android: {
                channelId,
                smallIcon: 'ic_launcher',
                color: '#6456B8',
                pressAction: { id: 'default' },
              },
            });
          }
        } catch (notifeeErr) {
          console.log('Notifee Error:', notifeeErr);
        }
      });
    } catch (e) {
      console.log('Firebase onMessage Setup Error:', e);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ login, logout, userToken, userData, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
