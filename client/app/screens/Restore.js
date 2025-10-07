import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoogleAuth } from '../services/gAuth';
import { listDriveBackups, restoreBackupFromDriveSimple } from '../services/gDrive';
import * as jwtDecode from 'jwt-decode';
import { useRouter } from 'expo-router';

const RestoreScreen = () => {
  const { token, promptAsync } = useGoogleAuth();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const router = useRouter();

  // 🔹 Decode token (debug info)
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode.default ? jwtDecode.default(token) : jwtDecode(token);
        console.log('Token expires at:', new Date(decoded.exp * 1000));
      } catch (err) {
        console.warn('Failed to decode token:', err);
      }
    }
  }, [token]);

  // 🔹 Auto Sign-In if not authenticated
  useEffect(() => {
    if (!token) {
      console.log('No token found → prompting Google sign-in...');
      promptAsync();
    }
  }, [token]);

  // 🔹 Once signed in, fetch and auto-restore latest backup
  useEffect(() => {
    const autoRestoreLatestBackup = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const files = await listDriveBackups(token);

        if (!files || files.length === 0) {
          Alert.alert('No backups found', 'You have no backups available on Google Drive.');
          setLoading(false);
          return;
        }

        // Sort backups by last modified time (most recent first)
        const sorted = files.sort(
          (a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime)
        );
        const latest = sorted[0];

        console.log('Auto restoring latest backup:', latest.name);

        setRestoring(true);
        await restoreBackupFromDriveSimple(token, latest.id);

        Alert.alert(
          'Restore Complete',
          `Successfully restored backup: ${latest.name}`,
          [
            {
              text: 'OK',
              onPress: () => router.push('/screens/Home'),
            },
          ]
        );
      } catch (err) {
        console.error('Restore failed:', err);
        Alert.alert('Error', err.message || 'Failed to restore backup.');
      } finally {
        setRestoring(false);
        setLoading(false);
      }
    };

    if (token) autoRestoreLatestBackup();
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Restoring Backup...</Text>

      {(loading || restoring) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            {loading ? 'Fetching latest backup...' : 'Restoring database...'}
          </Text>
        </View>
      )}

      {!loading && !restoring && token && (
        <Text style={styles.loadingText}>Preparing restore...</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  loadingContainer: { alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#666', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },
});

export default RestoreScreen;