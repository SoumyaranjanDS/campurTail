const fs = require('fs');

let c = fs.readFileSync('src/screens/HomeScreen.jsx', 'utf8');

if (!c.includes('lottie-react-native')) {
  c = c.replace(
    /import axios from 'axios';/,
    "import axios from 'axios';\nimport LottieView from 'lottie-react-native';",
  );
}

if (!c.includes('initialLoading')) {
  c = c.replace(
    /const \[refreshing, setRefreshing\] = useState\(false\);/,
    'const [refreshing, setRefreshing] = useState(false);\n  const [initialLoading, setInitialLoading] = useState(true);',
  );

  c = c.replace(
    /setIncidents\(response\.data\);/,
    'setIncidents(response.data);\n      setInitialLoading(false);',
  );

  c = c.replace(
    /console\.error\(error\);/g,
    'console.error(error);\n      setInitialLoading(false);',
  );
}

// Find the return block
const startScreen = c.indexOf('<Screen>');
if (startScreen !== -1 && !c.includes('initialLoading ?')) {
  const flatListStart = c.indexOf('<FlatList', startScreen);
  const flatListEnd = c.indexOf('/>', flatListStart) + 2;

  const originalFlatList = c.substring(flatListStart, flatListEnd);

  const newMarkup = `{initialLoading ? (
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../assets/animations/loading.json')}
            autoPlay
            loop
            style={styles.lottieAnim}
          />
        </View>
      ) : (
        ${originalFlatList}
      )}`;

  c = c.substring(0, flatListStart) + newMarkup + c.substring(flatListEnd);
}

if (!c.includes('lottieContainer')) {
  c = c.replace(
    /const styles = StyleSheet\.create\(\{/,
    `const styles = StyleSheet.create({
  lottieContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnim: {
    width: 250,
    height: 250,
  },`,
  );
}

fs.writeFileSync('src/screens/HomeScreen.jsx', c, 'utf8');
