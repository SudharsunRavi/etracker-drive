import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('etracker.db');

export const initDB = async () => {
  try {
    console.log('Initializing database...');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL
      );
    `);
    
    const oldTableExists = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'"
    );
    
    if (oldTableExists.length > 0) {
      console.log('Migrating data from old table...');
      const oldData = await db.getAllAsync('SELECT * FROM transactions');
      console.log('Old data to migrate:', oldData);

      for (const row of oldData) {
        await db.runAsync(
          'INSERT INTO transactions_new (amount, type, category, description, date) VALUES (?, ?, ?, ?, ?)',
          [
            parseFloat(row.date) || 0,
            row.category,                
            row.description,           
            row.type,      
            row.amount                   
          ]
        );
      }
      
      // Drop old table
      await db.execAsync('DROP TABLE transactions');
      
      // Rename new table
      await db.execAsync('ALTER TABLE transactions_new RENAME TO transactions');
      
      console.log('Data migration completed successfully');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const addTransaction = async (amount, type, category, description, date) => {
  try {
    console.log('Adding transaction with:', { amount, type, category, description, date });
    
    await db.runAsync(
      'INSERT INTO transactions (amount, type, category, description, date) VALUES (?, ?, ?, ?, ?)',
      [amount, type, category, description, date]
    );
    console.log('Transaction added successfully');
    return true;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getTransactions = async (type = null, category = null) => {
  try {
    console.log('Getting transactions with filters - Type:', type, 'Category:', category);
    
    let query = 'SELECT * FROM transactions';
    let params = [];

    if (type || category) {
      query += ' WHERE ';
      const conditions = [];
      
      if (type) {
        conditions.push('type = ?');
        params.push(type);
      }
      
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      
      query += conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';
    
    console.log('Final query:', query);
    console.log('Query params:', params);
    
    const result = await db.getAllAsync(query, params);
    console.log('Query result count:', result.length);
    console.log('Query result:', result);
    
    return result;
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const clearAllTransactions = async () => {
  try {
    await db.execAsync('DELETE FROM transactions');
    console.log('All transactions cleared');
    return true;
  } catch (error) {
    console.error('Error clearing transactions:', error);
    return false;
  }
};