import React, { useState, useContext } from 'react';
import { User, ContactRound, BookOpen } from 'lucide-react-native';
import axios from 'axios';

import { AuthContext } from '../../context/AuthContext';
import {
  AuthLayout,
  AuthField,
  AuthError,
  AuthButton,
  AuthLink,
} from '../../components/AuthUI';

const API_URL = 'https://tails.inkedfact.online/api/v1/auth';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!name || !registrationNumber || !branch) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        registrationNumber,
        branch,
      });

      login(response.data.token, response.data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      registration
      onBack={() => navigation.goBack()}
      title={'Your campus.\nYour voice.'}
      subtitle="Join Campus Pulse to report issues and follow their progress."
    >
      <AuthField
        label="Full name"
        icon={User}
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
      />

      <AuthField
        label="Registration number"
        icon={ContactRound}
        placeholder="Enter your registration number"
        value={registrationNumber}
        onChangeText={setRegistrationNumber}
        autoCapitalize="none"
      />

      <AuthField
        label="Branch"
        icon={BookOpen}
        placeholder="e.g., Computer Science"
        value={branch}
        onChangeText={setBranch}
      />

      <AuthError message={error} />

      <AuthButton
        title="Create account"
        loading={loading}
        onPress={handleRegister}
      />

      <AuthLink
        text="Already have an account?"
        action="Login"
        onPress={() => navigation.goBack()}
      />
    </AuthLayout>
  );
};

export default RegisterScreen;
