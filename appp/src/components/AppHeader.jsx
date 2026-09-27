import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

const AppHeader = ({ title, subtitle }) => {
  const { userData } = useContext(AuthContext);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{title}</Text>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
        {userData?.profilePhoto ? (
          <Image source={{ uri: userData.profilePhoto }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 32,
    fontWeight: '400',
    color: '#111827',
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#6366F1',
  },

  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
});

export default AppHeader;
