import DeviceInfo from 'react-native-device-info';

// Use localhost for physical devices connected via USB (adb reverse)
const WIFI_IP = 'http://localhost:5000';

// Special alias for Android Emulators to bypass Windows Firewall
const EMULATOR_IP = 'http://10.0.2.2:5000';

// Automatically swap the URL based on the device type!
export const BASE_URL = DeviceInfo.isEmulatorSync() ? EMULATOR_IP : WIFI_IP;

export const API_URL = `${BASE_URL}/api/v1`;
