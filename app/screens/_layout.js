import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Home';
import BackupScreen from './Backup';
import RestoreScreen from './Restore';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Backup" component={BackupScreen} />
        <Stack.Screen name="Restore" component={RestoreScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}