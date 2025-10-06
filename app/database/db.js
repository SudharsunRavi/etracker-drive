import * as SQLite from 'expo-sqlite';

// Open database
export const db = SQLite.openDatabaseSync('etracker.db');

// Initialize database with proper error handling
export const initDB = async () => {
  try {
    console.log('Initializing database...');
    
    // Use the correct API - runAsync for single queries
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Add transaction function
export const addTransaction = async (amount, type, category, description, date) => {
  try {
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

// Get all transactions
export const getTransactions = async () => {
  try {
    const result = await db.getAllAsync('SELECT * FROM transactions ORDER BY date DESC');
    return result;
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

// Get transactions by type
export const getTransactionsByType = async (type) => {
  try {
    const result = await db.getAllAsync(
      'SELECT * FROM transactions WHERE type = ? ORDER BY date DESC',
      [type]
    );
    return result;
  } catch (error) {
    console.error('Error getting transactions by type:', error);
    return [];
  }
};