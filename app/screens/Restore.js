import React, { useEffect, useState } from 'react';
import { View, Text, Alert, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { useGoogleAuth } from '../services/gAuth';
import { listDriveBackups, restoreBackupFromDrive } from '../services/gDrive';

const RestoreScreen = () => {
  const { token, promptAsync } = useGoogleAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const fetchBackups = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const files = await listDriveBackups(token);
        setBackups(files);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBackups();
  }, [token]);

  const handleRestoreDrive = async (fileId, name) => {
    try {
      setRestoring(true);
      await restoreBackupFromDrive(token, fileId);
      Alert.alert('Success', `Restored backup: ${name}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Restore Database</Text>

      {!token && <Button title="Sign in with Google" onPress={() => promptAsync()} />}

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}

      {token && backups.length > 0 && (
        <FlatList
          data={backups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.backupItem}
              onPress={() => handleRestoreDrive(item.id, item.name)}
              disabled={restoring}
            >
              <Text style={styles.backupName}>{item.name}</Text>
              <Text style={styles.backupDate}>{new Date(item.modifiedTime).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {restoring && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Restoring backup...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  backupItem: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 3 },
  backupName: { fontSize: 16, fontWeight: '600', color: '#333' },
  backupDate: { fontSize: 13, color: '#777', marginTop: 4 },
  loadingContainer: { alignItems: 'center', marginTop: 20 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
});

export default RestoreScreen;
