const fs = require('fs');
const glob = require('glob');
const path = require('path');

// NOTE: using a hardcoded list of files to avoid glob dependency if missing
const files = [
  'src/screens/auth/LoginScreen.jsx',
  'src/screens/auth/RegisterScreen.jsx',
  'src/context/AuthContext.js',
  'src/screens/ReportDetailScreen.jsx',
  'src/screens/HomeScreen.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    
    let modified = false;
    if (c.includes('Alert.alert')) {
      if (!c.includes('AlertContext')) {
        // Find a place to import AlertContext
        c = c.replace(
          /(import .* from 'react';)/,
          "$1\nimport { AlertContext } from '../../context/AlertContext';" // naive, might need fixing path
        );
        // Fix path for context vs screens
        if (file.includes('context/AuthContext')) {
           c = c.replace("../../context/AlertContext", "./AlertContext");
        } else if (file.includes('screens/ReportDetailScreen') || file.includes('screens/HomeScreen')) {
           c = c.replace("../../context/AlertContext", "../context/AlertContext");
        }
      }

      if (!c.includes('showAlert')) {
        // Need to add `const { showAlert } = useContext(AlertContext);` inside components
        // But doing it safely via regex is hard for arbitrary components.
        // I will just use a generic replace for Alert.alert with alert() temporarily, or maybe just tell the user to use it for now in Explore and Profile.
      }
    }
  }
});
