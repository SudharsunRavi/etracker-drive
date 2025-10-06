import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export const uploadToDrive = async () => {
  try {
    const dbPath = `${FileSystem.documentDirectory}SQLite/etracker.db`;
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    if (!dbInfo.exists) throw new Error('No database found. Add some transactions first.');

    const timestamp = new Date().toISOString().split('T')[0];
    const backupName = `expense_backup_${timestamp}.db`;
    const backupPath = `${FileSystem.cacheDirectory}${backupName}`;

    await FileSystem.copyAsync({ from: dbPath, to: backupPath });

    await Sharing.shareAsync(backupPath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Save to Google Drive or elsewhere',
    });

    setTimeout(() => FileSystem.deleteAsync(backupPath).catch(() => {}), 10000);

    return 'success';
  } catch (err) {
    console.error('Manual backup failed:', err);
    throw err;
  }
};

export const manualRestore = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/octet-stream',
      copyToCacheDirectory: true,
    });

    if (result.canceled) throw new Error('File selection cancelled');

    const backupFile = result.assets[0];
    const dbPath = `${FileSystem.documentDirectory}SQLite/etracker.db`;

    const timestamp = new Date().toISOString().split('T')[0];
    const currentBackupPath = `${FileSystem.cacheDirectory}pre_restore_${timestamp}.db`;
    try {
      await FileSystem.copyAsync({ from: dbPath, to: currentBackupPath });
    } catch (e) {
      console.log('No existing DB to backup before restore.');
    }

    await FileSystem.copyAsync({ from: backupFile.uri, to: dbPath });

    return 'success';
  } catch (err) {
    console.error('Manual restore failed:', err);
    throw err;
  }
};

export const listDriveBackups = async (accessToken) => {
  if (!accessToken) throw new Error('No access token provided');

  try {
    const query = encodeURIComponent("name contains 'expense_backup_' and trashed=false");
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;

    const res = await fetch(url, { 
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      } 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Drive API Error:', {
        status: res.status,
        statusText: res.statusText,
        error: errorText
      });
      throw new Error(`Drive API error: ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('List Drive Backups Error:', error);
    throw error;
  }
};

export const restoreBackupFromDrive = async (accessToken, fileId) => {
  if (!accessToken) throw new Error('No access token provided');
  if (!fileId) throw new Error('No fileId provided');

  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
  const dbPath = `${sqliteDir}/etracker.db`;

  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const downloadRes = await FileSystem.downloadAsync(url, dbPath, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (downloadRes.status && downloadRes.status !== 200) {
    throw new Error(`Failed to download backup from Drive. Status: ${downloadRes.status}`);
  }

  return downloadRes.uri;
};
