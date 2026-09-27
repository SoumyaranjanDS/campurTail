import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, FileText, Users, UserCog } from 'lucide-react-native';
import { View } from 'react-native';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminReports from '../screens/admin/AdminReports';
import AdminUsers from '../screens/admin/AdminUsers';
import AdminStaff from '../screens/admin/AdminStaff';

const Tab = createBottomTabNavigator();

const AdminBottomTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          if (route.name === 'Dashboard') IconComponent = LayoutDashboard;
          else if (route.name === 'Reports') IconComponent = FileText;
          else if (route.name === 'Students') IconComponent = Users;
          else if (route.name === 'Staff') IconComponent = UserCog;

          return (
            <View style={{
              backgroundColor: focused ? '#ffff' : 'transparent',
              paddingHorizontal: focused ? 24 : 12,
              paddingVertical: 12,
              borderRadius: 30,
            }}>
              <IconComponent size={20} color='#111827'/>
            </View>
          );
        },
        tabBarStyle: {
          backgroundColor: '#ffff',
          borderTopWidth: 0,
          elevation: 0,
          height: 80 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Reports" component={AdminReports} />
      <Tab.Screen name="Students" component={AdminUsers} />
      <Tab.Screen name="Staff" component={AdminStaff} />
    </Tab.Navigator>
  );
};

export default AdminBottomTabs;
