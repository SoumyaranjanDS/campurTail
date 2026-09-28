import React, { useState, useContext } from 'react';
import { API_URL as BASE_API_URL } from '../../config';
import { ContactRound } from 'lucide-react-native';
import axios from 'axios';

import { AuthContext } from '../../context/AuthContext';
import {
  AuthLayout,
  AuthField,
  AuthError,
  AuthButton,
  AuthLink,
} from '../../components/AuthUI';

// Keep your existing backend address.
const API_URL = `${BASE_API_URL}/auth`;

const LoginScreen = ({ navigation }) => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!registrationNumber) {
      setError('Registration number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/login`, {
        registrationNumber,
      });

      login(response.data.token, response.data.user);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={'Welcome back.'}
      subtitle="Report, follow up, and help make campus a little better."
    >
      <AuthField
        label="Registration number"
        icon={ContactRound}
        placeholder="Enter your registration number"
        value={registrationNumber}
        onChangeText={setRegistrationNumber}
        autoCapitalize="none"
      />

      <AuthError message={error} />

      <AuthButton title="Login" loading={loading} onPress={handleLogin} />

      <AuthLink
        text="New to Campus Pulse?"
        action="Create an account"
        onPress={() => navigation.navigate('Register')}
      />
    </AuthLayout>
  );
};

export default LoginScreen;
