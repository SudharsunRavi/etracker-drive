import { View, Text, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { uploadToDrive } from '../services/gDrive';
import { useState } from 'react';

const BackupScreen = () => {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setLoading(true);
      
      const backupId = await uploadToDrive();
      
      Alert.alert(
        'Backup Created Successfully', 
        'Your expense data has been backed up. Use the share sheet to save it to Google Drive or other cloud storage.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Error', `Backup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Backup to Google Drive</Text>
        
        <View style={styles.card}>
          <Text style={styles.description}>
            Create a backup of your expense data and save it to Google Drive.
          </Text>
          
          <Text style={styles.featureList}>
            • Creates local backup file{'\n'}
            • Opens share sheet for Google Drive{'\n'}
            • Manual save to cloud storage{'\n'}
            • Secure local storage
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Creating backup...</Text>
            </View>
          ) : (
            <Button 
              title="Create Backup & Save to Drive" 
              onPress={handleBackup}
              style={styles.button}
            />
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to save to Google Drive:</Text>
          <Text style={styles.infoText}>
            1. Tap "Create Backup"{'\n'}
            2. In the share sheet, choose "Save to Drive"{'\n'}
            3. Select your Google Drive folder{'\n'}
            4. Tap "Save"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: '#666',
    textAlign: 'center',
  },
  featureList: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
    color: '#666',
  },
  button: {
    marginTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});

export default BackupScreen;