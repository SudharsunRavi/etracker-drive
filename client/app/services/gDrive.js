import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

export const uploadToDrive = async (accessToken) => {
  try {
    const dbPath = `${FileSystem.documentDirectory}SQLite/etracker.db`;
    const dbInfo = await FileSystem.getInfoAsync(dbPath);

    if (!dbInfo.exists) {
      throw new Error('Local database file not found.');
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `expense_backup_${timestamp}.db`;

    const form = new FormData();
    form.append('metadata', {
      string: JSON.stringify({ 
        name: fileName, 
        mimeType: 'application/octet-stream',
        parents: ['root']
      }),
      type: 'application/json',
    });
    form.append('file', {
      uri: dbPath,
      type: 'application/octet-stream',
      name: fileName,
    });

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/related',
        },
        body: form,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Drive Upload Failed:', errText);
      throw new Error(`Google Drive upload failed: ${res.status}`);
    }

    const data = await res.json();
    console.log('Backup uploaded to Drive:', data);
    return data.id;
  } catch (err) {
    console.error('uploadToDrive Error:', err);
    throw err;
  }
};

export const listDriveBackups = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error('No access token provided');
    }

    const query = encodeURIComponent('name contains "expense_backup_" and trashed = false');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)`;

    console.log('Fetching backups from:', url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Drive API Error:', {
        status: res.status,
        statusText: res.statusText,
        error: errorText,
      });
      throw new Error(`Drive API error: ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();
    console.log('Found backups:', data.files?.length || 0);
    return data.files || [];
  } catch (err) {
    console.error('listDriveBackups Error:', err);
    throw err;
  }
};

const openDatabase = async () => {
  try {
    console.log('Attempting to open database...');
    
    if (SQLite.openDatabaseAsync) {
      console.log('Using openDatabaseAsync...');
      const db = await SQLite.openDatabaseAsync('etracker.db');
      console.log('Database opened with openDatabaseAsync');
      return db;
    }
    
    if (SQLite.openDatabaseSync) {
      console.log('Using openDatabaseSync...');
      const db = SQLite.openDatabaseSync('etracker.db');
      console.log('Database opened with openDatabaseSync');
      return db;
    }
    
    console.log('Using legacy openDatabase...');
    const db = SQLite.openDatabase('etracker.db');
    console.log('Database opened with openDatabase');
    return db;
    
  } catch (error) {
    console.error('Error opening database:', error);
    throw new Error(`Failed to open database: ${error.message}`);
  }
};

export const checkDatabaseHealth = async () => {
  try {
    const dbPath = `${FileSystem.documentDirectory}SQLite/etracker.db`;
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    
    if (!dbInfo.exists) {
      return { 
        exists: false, 
        writable: false, 
        size: 0,
        health: 'MISSING'
      };
    }

    let isWritable = false;
    let errorDetails = null;
    let databaseType = 'unknown';

    try {
      const db = await openDatabase();
      
      if (!db) {
        throw new Error('Database object is undefined');
      }

      if (typeof db.execAsync === 'function') {
        databaseType = 'async';
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS health_check (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        await db.runAsync(
          'INSERT INTO health_check DEFAULT VALUES;',
        );
        
        await db.execAsync('DROP TABLE IF EXISTS health_check;');
        
      } else if (typeof db.transaction === 'function') {
        databaseType = 'legacy';
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS health_check (id INTEGER PRIMARY KEY);',
              [],
              () => {
                tx.executeSql(
                  'INSERT INTO health_check DEFAULT VALUES;',
                  [],
                  () => {
                    tx.executeSql(
                      'DROP TABLE IF EXISTS health_check;',
                      [],
                      resolve,
                      reject
                    );
                  },
                  reject
                );
              },
              reject
            );
          });
        });
      }
      
      isWritable = true;
      console.log(`Database health check passed (type: ${databaseType})`);
      
    } catch (dbError) {
      errorDetails = dbError.message;
      console.error('Database health check failed:', dbError);
    }

    return {
      exists: true,
      writable: isWritable,
      size: dbInfo.size,
      health: isWritable ? 'HEALTHY' : 'READONLY',
      error: errorDetails,
      databaseType: databaseType
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return { 
      exists: false, 
      writable: false, 
      health: 'ERROR',
      error: error.message 
    };
  }
};

export const restoreBackupFromDriveSimple = async (token, fileId) => {
  try {
    console.log('Starting simple backup restoration...');
    
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    const mainDbPath = `${sqliteDir}/etracker.db`;
    
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!fileRes.ok) {
      throw new Error(`Download failed: ${fileRes.status}`);
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    await FileSystem.writeAsStringAsync(mainDbPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('✅ Backup restored successfully!');

    return { 
      success: true, 
      path: mainDbPath,
      message: 'Backup restored. Please restart the app to use the restored data.' 
    };
    
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
};