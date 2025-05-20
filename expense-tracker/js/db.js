/**
 * Database module for the Expense Tracker application
 * Uses IndexedDB for local storage
 */
class ExpenseDB {
  constructor() {
    this.dbName = 'expense-tracker-db';
    this.dbVersion = 1;
    this.db = null;
    this.initDB();
  }

  /**
   * Initialize the database
   * @returns {Promise} Promise that resolves when the database is ready
   */
  initDB() {
    return new Promise((resolve, reject) => {
      // Open the database
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject('Could not open database');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      // Create object stores when the database is first created or upgraded
      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create the expenses object store with auto-incrementing key
        const expensesStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        
        // Create indexes for querying
        expensesStore.createIndex('date', 'date', { unique: false });
        expensesStore.createIndex('category', 'category', { unique: false });
        expensesStore.createIndex('amount', 'amount', { unique: false });

        console.log('Database setup complete');
      };
    });
  }

  /**
   * Add a new expense record
   * @param {Object} expense - The expense object to add
   * @returns {Promise} Promise that resolves with the ID of the new expense
   */
  async addExpense(expense) {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      // Convert date string to Date object for consistent sorting
      if (typeof expense.date === 'string') {
        expense.date = new Date(expense.date);
      }

      // Add timestamp for tracking creation time
      expense.timestamp = new Date();

      const transaction = this.db.transaction(['expenses'], 'readwrite');
      const store = transaction.objectStore('expenses');
      const request = store.add(expense);

      request.onsuccess = (event) => {
        resolve(event.target.result); // Returns the new ID
      };

      request.onerror = (event) => {
        console.error('Error adding expense:', event.target.error);
        reject('Failed to add expense');
      };
    });
  }

  /**
   * Get all expenses
   * @returns {Promise} Promise that resolves with an array of all expenses
   */
  async getAllExpenses() {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readonly');
      const store = transaction.objectStore('expenses');
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error getting all expenses:', event.target.error);
        reject('Failed to get expenses');
      };
    });
  }

  /**
   * Get expenses for a specific date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise} Promise that resolves with an array of expenses in the date range
   */
  async getExpensesByDateRange(startDate, endDate) {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    // Convert string dates to Date objects if needed
    if (typeof startDate === 'string') {
      startDate = new Date(startDate);
    }
    
    if (typeof endDate === 'string') {
      endDate = new Date(endDate);
    }

    // Set the end date to the end of the day
    endDate.setHours(23, 59, 59, 999);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readonly');
      const store = transaction.objectStore('expenses');
      const dateIndex = store.index('date');
      
      // Use IDBKeyRange to get expenses between startDate and endDate
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = dateIndex.getAll(range);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error getting expenses by date range:', event.target.error);
        reject('Failed to get expenses by date range');
      };
    });
  }

  /**
   * Get expenses by category
   * @param {string} category - The category to filter by
   * @returns {Promise} Promise that resolves with an array of expenses in the category
   */
  async getExpensesByCategory(category) {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readonly');
      const store = transaction.objectStore('expenses');
      const categoryIndex = store.index('category');
      const request = categoryIndex.getAll(category);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error getting expenses by category:', event.target.error);
        reject('Failed to get expenses by category');
      };
    });
  }

  /**
   * Get a single expense by ID
   * @param {number} id - The ID of the expense to retrieve
   * @returns {Promise} Promise that resolves with the expense object
   */
  async getExpenseById(id) {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readonly');
      const store = transaction.objectStore('expenses');
      const request = store.get(id);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error getting expense by ID:', event.target.error);
        reject('Failed to get expense');
      };
    });
  }

  /**
   * Update an existing expense
   * @param {Object} expense - The expense object with updated values
   * @returns {Promise} Promise that resolves when the expense is updated
   */
  async updateExpense(expense) {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      // Convert date string to Date object for consistent sorting
      if (typeof expense.date === 'string') {
        expense.date = new Date(expense.date);
      }

      const transaction = this.db.transaction(['expenses'], 'readwrite');
      const store = transaction.objectStore('expenses');
      const request = store.put(expense);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error updating expense:', event.target.error);
        reject('Failed to update expense');
      };
    });
  }

  /**
   * Delete an expense by ID
   * @param {number} id - The ID of the expense to delete
   * @returns {Promise} Promise that resolves when the expense is deleted
   */
  async deleteExpense(id) {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readwrite');
      const store = transaction.objectStore('expenses');
      const request = store.delete(id);

      request.onsuccess = (event) => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('Error deleting expense:', event.target.error);
        reject('Failed to delete expense');
      };
    });
  }

  /**
   * Get summary statistics for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise} Promise that resolves with summary statistics
   */
  async getSummaryStats(startDate, endDate) {
    try {
      const expenses = await this.getExpensesByDateRange(startDate, endDate);
      
      // Calculate total
      const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      
      // Group by category
      const categories = {};
      expenses.forEach(expense => {
        if (!categories[expense.category]) {
          categories[expense.category] = 0;
        }
        categories[expense.category] += Number(expense.amount);
      });

      // Group by date for daily breakdown
      const dailyData = {};
      expenses.forEach(expense => {
        const dateStr = expense.date.toISOString().split('T')[0];
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = 0;
        }
        dailyData[dateStr] += Number(expense.amount);
      });

      return {
        total,
        categories,
        dailyData,
        count: expenses.length
      };
    } catch (error) {
      console.error('Error getting summary stats:', error);
      throw error;
    }
  }

  /**
   * Clear all data from the database
   * @returns {Promise} Promise that resolves when the database is cleared
   */
  async clearAllData() {
    // Make sure the database is initialized
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['expenses'], 'readwrite');
      const store = transaction.objectStore('expenses');
      const request = store.clear();

      request.onsuccess = (event) => {
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('Error clearing database:', event.target.error);
        reject('Failed to clear database');
      };
    });
  }
}

// Export the database class
const expenseDB = new ExpenseDB();
