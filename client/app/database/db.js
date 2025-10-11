import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('etracker.db');

export const initDB = async () => {
  try {
    console.log('Initializing database...');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      );
    `);

    try {
      await db.execAsync(`
        INSERT OR IGNORE INTO categories (name, type) VALUES 
        ('Salary', 'income'),
        ('Freelance', 'income'),
        ('Investment', 'income'),
        ('Food', 'expense'),
        ('Transport', 'expense'),
        ('Entertainment', 'expense'),
        ('Shopping', 'expense'),
        ('Bills', 'expense'),
        ('Healthcare', 'expense')
      `);
      console.log('Default categories inserted');
    } catch (error) {
      console.log('Default categories may already exist:', error.message);
    }

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const addTransaction = async (amount, type, category, description, date) => {
  try {
    console.log('Adding transaction:', { amount, type, category, description, date });
    
    const result = await db.runAsync(
      'INSERT INTO transactions (amount, type, category, description, date) VALUES (?, ?, ?, ?, ?)',
      [amount, type, category, description, date]
    );
    
    console.log('Transaction added successfully, ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getTransactions = async (type = null, category = null) => {
  try {
    let query = 'SELECT * FROM transactions WHERE 1=1';
    let params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY date DESC';

    console.log('Executing query:', query, 'Params:', params);

    const result = await db.getAllAsync(query, params);
    console.log(`Found ${result.length} transactions`);
    
    return result;
  } catch (error) {
    console.error('Error getting transactions:', error);
    if (error.message?.includes('no such table')) {
      return [];
    }
    throw error;
  }
};

export const getTransactionsWithDateRange = async (dateFilter = null) => {
  try {
    let query = 'SELECT * FROM transactions WHERE 1=1';
    let params = [];

    if (dateFilter && dateFilter.from && dateFilter.to) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(dateFilter.from, dateFilter.to);
    }

    query += ' ORDER BY date DESC';

    console.log('Date filter query:', query, 'Params:', params);

    const result = await db.getAllAsync(query, params);
    console.log(`Found ${result.length} transactions with date filter`);
    
    return result;
  } catch (error) {
    console.error('Error getting transactions with date filter:', error);
    if (error.message?.includes('no such table')) {
      return [];
    }
    throw error;
  }
};

export const clearAllTransactions = async () => {
  try {
    await db.execAsync('DELETE FROM transactions');
    console.log('All transactions cleared');
    return true;
  } catch (error) {
    console.error('Error clearing transactions:', error);
    throw error;
  }
};

export const updateTransaction = async (id, updatedFields) => {
  try {
    console.log('Updating transaction:', id, 'with fields:', updatedFields);

    if (!id || typeof id !== 'number') {
      throw new Error('Invalid transaction ID provided.');
    }

    const allowedFields = ['amount', 'type', 'category', 'description', 'date'];
    const keys = Object.keys(updatedFields).filter((key) =>
      allowedFields.includes(key)
    );

    if (keys.length === 0) {
      throw new Error('No valid fields provided to update.');
    }

    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const values = keys.map((key) => updatedFields[key]);

    await db.runAsync(
      `UPDATE transactions SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    console.log('Transaction updated successfully:', id);
    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    console.log('Transaction deleted successfully:', id);
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const getCategories = async (type = null) => {
  try {
    let query = 'SELECT * FROM categories';
    let params = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    query += ' ORDER BY type, name';

    const result = await db.getAllAsync(query, params);
    return result;
  } catch (error) {
    console.error('Error fetching categories:', error);
    if (error.message?.includes('no such table')) {
      return [];
    }
    throw error;
  }
};

export const addCategory = async (name, type) => {
  try {
    const result = await db.runAsync(
      'INSERT INTO categories (name, type) VALUES (?, ?)',
      [name, type]
    );
    console.log('Category added:', name, 'ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (id, name, type) => {
  try {
    await db.runAsync(
      'UPDATE categories SET name = ?, type = ? WHERE id = ?',
      [name, type, id]
    );
    console.log('Category updated:', id);
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    console.log('Category deleted:', id);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const checkDatabaseStatus = async () => {
  try {
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'"
    );
    
    const tableExists = tables.length > 0;
    console.log('Transactions table exists:', tableExists);
    
    if (tableExists) {
      const columns = await db.getAllAsync("PRAGMA table_info(transactions)");
      console.log('Transactions table columns:', columns);
      
      const countResult = await db.getAllAsync("SELECT COUNT(*) as count FROM transactions");
      const recordCount = countResult[0].count;
      
      const result = {
        tableExists: true,
        columns: columns,
        recordCount: recordCount
      };
      console.log('Database status:', result);
      return result;
    } else {
      return { tableExists: false };
    }
  } catch (error) {
    console.error('Error checking database status:', error);
    return { tableExists: false, error: error.message };
  }
};

export const testDatabaseOperations = async () => {
  try {
    console.log('Testing database operations...');
    await initDB();
  
    const status = await checkDatabaseStatus();
    console.log('Database status:', status);
    
    const testId = await addTransaction(
      99.99, 
      'income', 
      'Test', 
      'Android test transaction', 
      new Date().toISOString()
    );
    console.log('Test transaction added with ID:', testId);
    
    const transactions = await getTransactions();
    console.log('Total transactions after test:', transactions.length);
    
    if (testId) {
      await deleteTransaction(testId);
      console.log('Test transaction cleaned up');
    }
    
    return { success: true, initialCount: status.recordCount, finalCount: transactions.length - 1 };
  } catch (error) {
    console.error('Database test failed:', error);
    return { success: false, error: error.message };
  }
};

export default db;