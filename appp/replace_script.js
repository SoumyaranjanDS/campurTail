const fs = require('fs');

let c = fs.readFileSync('src/screens/ProfileScreen.jsx', 'utf8');

if (!c.includes('AlertContext')) {
  c = c.replace(
    "import { AuthContext } from '../context/AuthContext';",
    "import { AuthContext } from '../context/AuthContext';\nimport { AlertContext } from '../context/AlertContext';"
  );
}

if (!c.includes('showAlert')) {
  c = c.replace(
    "const { userData, userToken, logout, login } = useContext(AuthContext);",
    "const { userData, userToken, logout, login } = useContext(AuthContext);\n  const { showAlert } = useContext(AlertContext);"
  );
}

// Replace all Alert.alert(title, msg) with showAlert(title, msg, 'error')
c = c.replace(/Alert\.alert\(\s*'([^']*)',\s*([^,)]*)\s*\)/g, (match, title, msg) => {
  const type = title.toLowerCase().includes('success') ? 'success' : 'error';
  return `showAlert('${title}', ${msg}, '${type}')`;
});

fs.writeFileSync('src/screens/ProfileScreen.jsx', c, 'utf8');
