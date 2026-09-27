import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, FileText } from 'lucide-react-native';
import { View } from 'react-native';

import StaffTaskBoard from '../screens/staff/StaffTaskBoard';
import StaffProfile from '../screens/staff/StaffProfile';

const Tab = createBottomTabNavigator();

const StaffBottomTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => {
          let IconComponent = route.name === 'Tasks' ? LayoutDashboard : FileText;
          
          return (
            <View style={{
              backgroundColor: focused ? '#EEE7F7' : 'transparent',
              paddingHorizontal: focused ? 24 : 12,
              paddingVertical: 12,
              borderRadius: 30,
            }}>
              <IconComponent size={20} color={focused ? '#6456B8' : '#82838F'} strokeWidth={focused ? 2.5 : 2} />
            </View>
          );
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          elevation: 0,
          height: 80 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
        },
      })}
    >
      <Tab.Screen name="Tasks" component={StaffTaskBoard} />
      <Tab.Screen name="Profile" component={StaffProfile} />
    </Tab.Navigator>
  );
};

export default StaffBottomTabs;
