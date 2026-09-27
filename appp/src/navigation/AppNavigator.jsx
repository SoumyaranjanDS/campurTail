import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import BottomTabs from './BottomTabs';
import ReportDetailScreen from '../screens/ReportDetailScreen';

import AdminBottomTabs from './AdminBottomTabs';
import StaffBottomTabs from './StaffBottomTabs';
import CreateStaff from '../screens/admin/CreateStaff';
import StaffManagement from '../screens/admin/StaffManagement';
import AdminProfile from '../screens/admin/AdminProfile';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userToken, userData, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        }}
      >
        <ActivityIndicator size="large" color="#2454D6" />
      </View>
    );
  }

  if (userToken && userData?.role === 'admin') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminMain" component={AdminBottomTabs} />
        <Stack.Screen name="CreateStaff" component={CreateStaff} />
        <Stack.Screen name="StaffManagement" component={StaffManagement} />
        <Stack.Screen name="AdminProfile" component={AdminProfile} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      </Stack.Navigator>
    );
  }

  if (userToken && userData?.role === 'staff') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="StaffMain" component={StaffBottomTabs} />
        <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      </Stack.Navigator>
    );
  }

  // Student Navigator
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        <>
          <Stack.Screen name="MainApp" component={BottomTabs} />
          <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
