import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const SettingsScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/CategoryScreen')}>
        <Text style={styles.buttonText}>Category</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/Backup')}>
        <Text style={styles.buttonText}>Backup</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/screens/Restore')}>
        <Text style={styles.buttonText}>Restore</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 8, marginBottom: 10 },
  buttonText: { fontSize: 16, fontWeight: '500' },
});

export default SettingsScreen;
