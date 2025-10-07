import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { useGoogleAuth } from '../services/gAuth';
import { uploadToDrive } from '../services/gDrive';

const BackupScreen = () => {
  const [loading, setLoading] = useState(false);
  const { token, promptAsync } = useGoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  useEffect(() => {
    if (token) {
      console.log('Google token available, ready to upload.');
    }
  }, [token]);

  const handleBackup = useCallback(async () => {
    try {
      if (!token) {
        Alert.alert(
          'Sign in Required',
          'Please sign in with Google to create a backup.',
          [{ text: 'OK', onPress: () => promptAsync() }]
        );
        return;
      }

      setLoading(true);

      const backupId = await uploadToDrive(token);

      Alert.alert(
        'Backup Created Successfully',
        'Your expense data has been backed up to Google Drive!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Backup Failed', error.message);
    } finally {
      setLoading(false);
    }
  }, [token, promptAsync]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Backup to Google Drive</Text>

        <View style={styles.card}>
          <Text style={styles.description}>
            Create a backup of your expense data and save it securely to Google Drive.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Creating backup...</Text>
            </View>
          ) : (
            <Button 
              title={token ? "Create Backup & Upload" : "Sign in & Backup"} 
              onPress={handleBackup} 
              style={styles.button} 
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#333' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 15, color: '#666', textAlign: 'center' },
  button: { marginTop: 10 },
  loadingContainer: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  infoCard: { backgroundColor: '#e8f4fd', borderRadius: 12, padding: 20, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  infoTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#007AFF' },
  infoText: { fontSize: 14, lineHeight: 20, color: '#666' },
});

export default BackupScreen;
