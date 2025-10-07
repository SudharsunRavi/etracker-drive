import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

// --- Upload local backup to Drive ---
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
        parents: ['root'] // Ensure file is created in root directory
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

// --- List backups ---
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

/**
 * Restore a backup file from Google Drive - FIXED SQL PARAMETERS
 * @param {string} token - Google OAuth access token
 * @param {string} fileId - Google Drive file ID
 */
export const restoreBackupFromDrive = async (token, fileId) => {
  let tempBackupPath = null;
  
  try {
    console.log('Starting backup restoration...', { fileId });
    
    // Step 1: Ensure SQLite directory exists
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
      console.log('Created SQLite directory:', sqliteDir);
    }

    // Step 2: Backup existing database first
    const mainDbPath = `${sqliteDir}/etracker.db`;
    const existingDbInfo = await FileSystem.getInfoAsync(mainDbPath);
    
    if (existingDbInfo.exists) {
      tempBackupPath = `${sqliteDir}/etracker_backup_${Date.now()}.db`;
      await FileSystem.copyAsync({ from: mainDbPath, to: tempBackupPath });
      console.log('Existing database backed up to:', tempBackupPath);
    }

    // Step 3: Download file from Drive
    console.log('Downloading backup from Drive...');
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!fileRes.ok) {
      const errText = await fileRes.text();
      console.error('Drive download error:', errText);
      throw new Error(`Failed to download file: ${fileRes.status}`);
    }

    // Step 4: Get the response as array buffer and convert to base64
    const arrayBuffer = await fileRes.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Step 5: Write the restored database data
    console.log('Writing restored database...');
    await FileSystem.writeAsStringAsync(mainDbPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Backup restored successfully to:', mainDbPath);

    // Step 6: VERIFY DATABASE IS WRITABLE - FIXED SQL PARAMETERS
    console.log('Testing database write permissions...');
    
    try {
      // Open database
      const db = await openDatabase();
      console.log('Database opened successfully');
      
      if (!db) {
        throw new Error('Failed to open database - returned undefined');
      }

      // TEST 1: Simple table creation (no parameters)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS restore_test (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // TEST 2: Insert with proper string parameter
      const testText = `write_test_${Date.now()}`;
      await db.runAsync(
        'INSERT INTO restore_test (test_text) VALUES (?);',
        [testText] // Pass as array of parameters
      );

      // TEST 3: Read back the data
      const result = await db.getAllAsync('SELECT * FROM restore_test;');
      console.log('Write test results:', result);

      // TEST 4: Update with proper parameters
      const updatedText = `updated_${Date.now()}`;
      await db.runAsync(
        'UPDATE restore_test SET test_text = ? WHERE test_text = ?;',
        [updatedText, testText] // Pass both parameters as array
      );

      // TEST 5: Verify update worked
      const updatedResult = await db.getAllAsync(
        'SELECT * FROM restore_test WHERE test_text = ?;',
        [updatedText]
      );
      console.log('Update verification:', updatedResult);

      // Clean up
      await db.execAsync('DROP TABLE IF EXISTS restore_test;');

      console.log('✅ All write tests passed! Database is fully writable.');
      
    } catch (dbError) {
      console.error('❌ Database write test failed:', dbError);
      
      let errorMessage = 'Database is not writable after restoration. ';
      
      if (dbError.message?.includes('cast to type String')) {
        errorMessage += 'SQL parameter type error detected. ';
      }
      
      errorMessage += `Technical details: ${dbError.message}`;
      
      // Restore the backup if write test fails
      if (tempBackupPath) {
        console.log('Restoring original database due to write test failure...');
        await FileSystem.copyAsync({ from: tempBackupPath, to: mainDbPath });
        console.log('Original database restored');
      }
      
      throw new Error(errorMessage);
    }

    // Clean up temporary backup
    if (tempBackupPath) {
      await FileSystem.deleteAsync(tempBackupPath);
      console.log('Temporary backup cleaned up');
    }

    console.log('🎉 Backup restoration completed successfully!');
    return {
      success: true,
      path: mainDbPath,
      message: 'Database restored and verified as writable'
    };
    
  } catch (error) {
    console.error('❌ restoreBackupFromDrive Error:', error);
    
    // Restore original backup if something went wrong
    if (tempBackupPath) {
      try {
        const mainDbPath = `${FileSystem.documentDirectory}SQLite/etracker.db`;
        await FileSystem.copyAsync({ from: tempBackupPath, to: mainDbPath });
        console.log('Original database restored due to error');
        await FileSystem.deleteAsync(tempBackupPath);
      } catch (restoreError) {
        console.error('Failed to restore original database:', restoreError);
      }
    }
    
    throw error;
  }
};

// Fixed database opening with better error handling
const openDatabase = async () => {
  try {
    console.log('Attempting to open database...');
    
    // Method 1: Try the newer async API first
    if (SQLite.openDatabaseAsync) {
      console.log('Using openDatabaseAsync...');
      const db = await SQLite.openDatabaseAsync('etracker.db');
      console.log('Database opened with openDatabaseAsync');
      return db;
    }
    
    // Method 2: Try the sync API
    if (SQLite.openDatabaseSync) {
      console.log('Using openDatabaseSync...');
      const db = SQLite.openDatabaseSync('etracker.db');
      console.log('Database opened with openDatabaseSync');
      return db;
    }
    
    // Method 3: Fallback to legacy method
    console.log('Using legacy openDatabase...');
    const db = SQLite.openDatabase('etracker.db');
    console.log('Database opened with openDatabase');
    return db;
    
  } catch (error) {
    console.error('Error opening database:', error);
    throw new Error(`Failed to open database: ${error.message}`);
  }
};

// Enhanced health check with proper SQL parameters
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

      // Determine database type by available methods
      if (typeof db.execAsync === 'function') {
        databaseType = 'async';
        // Simple write test with no parameters
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS health_check (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Insert with proper parameter
        await db.runAsync(
          'INSERT INTO health_check DEFAULT VALUES;',
          [] // Empty array for no parameters
        );
        
        // Clean up
        await db.execAsync('DROP TABLE IF EXISTS health_check;');
        
      } else if (typeof db.transaction === 'function') {
        databaseType = 'legacy';
        // Use transaction-based API
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

// SIMPLIFIED VERSION - Use this if the above still has issues
export const restoreBackupFromDriveSimple = async (token, fileId) => {
  try {
    console.log('Starting simple backup restoration...');
    
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
    const mainDbPath = `${sqliteDir}/etracker.db`;
    
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    // Download and restore
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
    
    // Skip database testing - let main app handle it
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