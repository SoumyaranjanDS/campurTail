import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, PlusCircle, User } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home,
  Report: PlusCircle,
  Profile: User,
};

const BottomTabs = () => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabelPosition: 'below-icon',

        tabBarActiveTintColor: '#242424',
        tabBarInactiveTintColor: '#959595',

        tabBarIcon: ({ focused, color }) => {
          const Icon = ICONS[route.name];

          return (
            <Icon size={22} color={color} strokeWidth={focused ? 2 : 1.6} />
          );
        },

        tabBarStyle: [
          styles.tabBar,
          {
            height: 54 + bottomPadding,
            paddingBottom: bottomPadding,
          },
        ],

        tabBarLabelStyle: styles.label,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Report" component={ExploreScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8E8',
    paddingTop: 7,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default BottomTabs;
