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
        date TEXT NOT NULL,
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        createdAt TEXT DEFAULT (datetime('now', 'localtime'))
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
          `INSERT INTO transactions_new (amount, type, category, description, date, createdAt)
          VALUES (?, ?, ?, ?, ?, COALESCE(?, datetime('now', 'localtime')))`,
          [
            row.amount,
            row.type,
            row.category,
            row.description,
            row.date,
            row.createdAt
          ]
        );
      }
      
      await db.execAsync('DROP TABLE transactions');
  
      await db.execAsync('ALTER TABLE transactions_new RENAME TO transactions');
      
      console.log('Data migration completed successfully');
    } else {
      const columnExists = await db.getAllAsync(
        "PRAGMA table_info(transactions)"
      );
      const hasCreatedAt = columnExists.some(col => col.name === 'createdAt');
      if (!hasCreatedAt) {
        console.log('Adding createdAt column to existing transactions table...');
        await db.execAsync(
          "ALTER TABLE transactions ADD COLUMN createdAt TEXT DEFAULT (datetime('now', 'localtime'))"
        );
      }
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
      `UPDATE transactions 
       SET ${setClause}, createdAt = datetime('now', 'localtime') 
       WHERE id = ?`,
      [...values, id]
    );

    console.log('Transaction updated successfully:', id);
    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const getCategories = async (type = null) => {
  try {
    if (type) {
      return await db.getAllAsync('SELECT * FROM categories WHERE type = ? ORDER BY name', [type]);
    }
    return await db.getAllAsync('SELECT * FROM categories ORDER BY type, name');
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const addCategory = async (name, type) => {
  try {
    await db.runAsync('INSERT INTO categories (name, type) VALUES (?, ?)', [name, type]);
    console.log('Category added:', name);
    return true;
  } catch (error) {
    console.error('Error adding category:', error);
    return false;
  }
};

export const updateCategory = async (id, name, type) => {
  try {
    await db.runAsync('UPDATE categories SET name = ?, type = ? WHERE id = ?', [name, type, id]);
    console.log('Category updated:', id);
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    return false;
  }
};

export const deleteCategory = async (id) => {
  try {
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    console.log('Category deleted:', id);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

