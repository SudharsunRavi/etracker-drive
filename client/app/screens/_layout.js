import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Home';
import BackupScreen from './Backup';
import RestoreScreen from './Restore';
import AddTransaction from './AddTransaction';
import SettingsScreen from './Settings';
import Charts from './Charts';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Backup" component={BackupScreen} />
        <Stack.Screen name="Restore" component={RestoreScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransaction} />
        <Stack.Screen name="Charts" component={Charts} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}