/**
 * Main application logic for the Expense Tracker
 */

// Wait for DOM to load before initializing the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the app
  initApp();
});

/**
 * Initialize the application
 */
async function initApp() {
  // Set up event listeners
  setupEventListeners();

  // Set default date to today for add expense form
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expense-date').value = today;
  document.getElementById('start-date').value = today;

  // Initialize dark mode from saved preference
  initDarkMode();

  // Initially load daily view for today
  await loadExpenses();

  // Initialize chart
  initChart();
}

/**
 * Initialize dark mode based on saved preferences or system preference
 */
function initDarkMode() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  
  // If no saved preference, check system preference
  if (!savedTheme) {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateDarkModeToggleText('dark');
    }
  } else {
    // Apply saved preference
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkModeToggleText(savedTheme);
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Form submission
  document.getElementById('expense-form').addEventListener('submit', handleAddExpense);

  // Edit form submission
  document.getElementById('edit-expense-form').addEventListener('submit', handleUpdateExpense);

  // Delete button in modal
  document.getElementById('delete-expense').addEventListener('click', handleDeleteExpense);

  // Dark mode toggle
  document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

  // Close modal button
  document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('edit-modal').style.display = 'none';
  });

  // Click outside modal to close
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Timeframe selection
  document.getElementById('timeframe').addEventListener('change', handleTimeframeChange);

  // Date range selection
  document.getElementById('start-date').addEventListener('change', loadExpenses);
  document.getElementById('end-date').addEventListener('change', loadExpenses);

  // Category filter
  document.getElementById('category-filter').addEventListener('change', loadExpenses);

  // Sort options
  document.getElementById('sort-by').addEventListener('change', loadExpenses);
}

/**
 * Handle adding a new expense
 * @param {Event} event - Form submit event
 */
async function handleAddExpense(event) {
  event.preventDefault();

  const name = document.getElementById('expense-name').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;
  const notes = document.getElementById('expense-notes').value;

  // Create expense object
  const expense = {
    name,
    amount,
    category,
    date: new Date(date),
    notes
  };

  try {
    // Add to database
    await expenseDB.addExpense(expense);

    // Reset the form
    document.getElementById('expense-form').reset();
    
    // Set the date field back to today
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];

    // Reload expenses
    await loadExpenses();

    // Show success message
    showNotification('Expense added successfully', 'success');
  } catch (error) {
    console.error('Error adding expense:', error);
    showNotification('Failed to add expense', 'error');
  }
}

/**
 * Handle updating an existing expense
 * @param {Event} event - Form submit event
 */
async function handleUpdateExpense(event) {
  event.preventDefault();

  const id = parseInt(document.getElementById('edit-expense-id').value);
  const name = document.getElementById('edit-expense-name').value;
  const amount = parseFloat(document.getElementById('edit-expense-amount').value);
  const category = document.getElementById('edit-expense-category').value;
  const date = document.getElementById('edit-expense-date').value;
  const notes = document.getElementById('edit-expense-notes').value;

  // Create expense object
  const expense = {
    id,
    name,
    amount,
    category,
    date: new Date(date),
    notes
  };

  try {
    // Update in database
    await expenseDB.updateExpense(expense);

    // Close the modal
    document.getElementById('edit-modal').style.display = 'none';

    // Reload expenses
    await loadExpenses();

    // Show success message
    showNotification('Expense updated successfully', 'success');
  } catch (error) {
    console.error('Error updating expense:', error);
    showNotification('Failed to update expense', 'error');
  }
}

/**
 * Handle deleting an expense
 */
async function handleDeleteExpense() {
  const id = parseInt(document.getElementById('edit-expense-id').value);

  try {
    // Delete from database
    await expenseDB.deleteExpense(id);

    // Close the modal
    document.getElementById('edit-modal').style.display = 'none';

    // Reload expenses
    await loadExpenses();

    // Show success message
    showNotification('Expense deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting expense:', error);
    showNotification('Failed to delete expense', 'error');
  }
}

/**
 * Handle timeframe selection change
 */
function handleTimeframeChange() {
  const timeframe = document.getElementById('timeframe').value;
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const dateSeparator = document.getElementById('date-separator');
  
  const today = new Date();
  
  switch (timeframe) {
    case 'daily':
      // Show only start date, hide end date
      startDateInput.value = today.toISOString().split('T')[0];
      endDateInput.style.display = 'none';
      dateSeparator.style.display = 'none';
      break;
      
    case 'weekly':
      // Calculate the start of the week (Sunday)
      const startOfWeek = new Date(today);
      const day = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
      startOfWeek.setDate(today.getDate() - day);
      
      // Set date range for the week
      startDateInput.value = startOfWeek.toISOString().split('T')[0];
      endDateInput.value = today.toISOString().split('T')[0];
      endDateInput.style.display = 'inline-block';
      dateSeparator.style.display = 'inline-block';
      break;
      
    case 'monthly':
      // Calculate the start of the month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Set date range for the month
      startDateInput.value = startOfMonth.toISOString().split('T')[0];
      endDateInput.value = today.toISOString().split('T')[0];
      endDateInput.style.display = 'inline-block';
      dateSeparator.style.display = 'inline-block';
      break;
  }
  
  // Reload expenses with new time range
  loadExpenses();
}

/**
 * Load and display expenses based on current filters
 */
async function loadExpenses() {
  try {
    // Get date range
    const startDate = new Date(document.getElementById('start-date').value);
    
    let endDate;
    const timeframe = document.getElementById('timeframe').value;
    if (timeframe === 'daily') {
      // For daily view, end date is the same as start date
      endDate = new Date(startDate);
    } else {
      // For weekly/monthly view, get the end date from input
      endDate = new Date(document.getElementById('end-date').value);
    }
    
    // Get category filter
    const categoryFilter = document.getElementById('category-filter').value;
    
    // Get sort option
    const sortOption = document.getElementById('sort-by').value;
    
    // Get expenses for the date range
    let expenses = await expenseDB.getExpensesByDateRange(startDate, endDate);
    
    // Apply category filter if not set to 'all'
    if (categoryFilter !== 'all') {
      expenses = expenses.filter(expense => expense.category === categoryFilter);
    }
    
    // Apply sorting
    expenses = sortExpenses(expenses, sortOption);
    
    // Display the expenses
    displayExpenses(expenses);
    
    // Update the summary
    updateSummary(startDate, endDate);
    
    // Update the chart
    updateChart(startDate, endDate);
  } catch (error) {
    console.error('Error loading expenses:', error);
    showNotification('Failed to load expenses', 'error');
  }
}

/**
 * Sort expenses based on the selected option
 * @param {Array} expenses - The expenses to sort
 * @param {string} sortOption - The sort option
 * @returns {Array} Sorted expenses
 */
function sortExpenses(expenses, sortOption) {
  switch (sortOption) {
    case 'date-desc':
      return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      
    case 'date-asc':
      return expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
      
    case 'amount-desc':
      return expenses.sort((a, b) => b.amount - a.amount);
      
    case 'amount-asc':
      return expenses.sort((a, b) => a.amount - b.amount);
      
    default:
      return expenses;
  }
}

/**
 * Display expenses in the list
 * @param {Array} expenses - The expenses to display
 */
function displayExpenses(expenses) {
  const expenseList = document.getElementById('expense-list');
  
  // Clear the list
  expenseList.innerHTML = '';
  
  if (expenses.length === 0) {
    // Show message when no expenses
    const noExpensesItem = document.createElement('li');
    noExpensesItem.className = 'no-expenses';
    noExpensesItem.textContent = 'No expenses to show';
    expenseList.appendChild(noExpensesItem);
    return;
  }
  
  // Add each expense to the list
  expenses.forEach(expense => {
    const listItem = document.createElement('li');
    listItem.className = 'expense-item';
    listItem.dataset.id = expense.id;
    
  // Format date
    const date = new Date(expense.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Get category icon
    const categoryIcons = {
      food: 'fa-utensils',
      transportation: 'fa-car',
      utilities: 'fa-bolt',
      entertainment: 'fa-film',
      shopping: 'fa-shopping-bag',
      health: 'fa-heart',
      housing: 'fa-home',
      other: 'fa-receipt'
    };

    // Determine amount class based on value
    const determineAmountClass = (amount) => {
      if (amount >= 1000) return 'high';
      if (amount >= 500) return 'medium';
      return 'low';
    };

    // Calculate the relative width for the progress bar (max 100%)
    const maxAmount = Math.max(...expenses.map(e => e.amount));
    const progressWidth = (expense.amount / maxAmount) * 100;
    
    listItem.innerHTML = `
      <div class="expense-details">
        <div class="expense-name">
          <span class="category-icon category-${expense.category}">
            <i class="fas ${categoryIcons[expense.category]}"></i>
          </span>
          ${expense.name}
        </div>
        <div class="expense-meta">
          <span class="category-badge ${expense.category}">${capitalizeFirstLetter(expense.category)}</span>
          <span class="expense-date">
            <i class="far fa-calendar-alt"></i>
            ${formattedDate}
          </span>
        </div>
        ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
      </div>
      <div class="expense-amount ${determineAmountClass(expense.amount)}">₹${expense.amount.toFixed(2)}</div>
      <div class="expense-actions">
        <button class="edit-btn" data-id="${expense.id}">
          <i class="fas fa-edit"></i>
        </button>
      </div>
      <div class="expense-progress" style="width: ${progressWidth}%"></div>
    `;
    
    // Add edit event listener
    const editButton = listItem.querySelector('.edit-btn');
    editButton.addEventListener('click', () => openEditModal(expense.id));
    
    // Add to list
    expenseList.appendChild(listItem);
  });
}

/**
 * Open the edit modal for an expense
 * @param {number} id - The ID of the expense to edit
 */
async function openEditModal(id) {
  try {
    // Get the expense
    const expense = await expenseDB.getExpenseById(id);
    
    if (!expense) {
      console.error('Expense not found:', id);
      return;
    }
    
    // Populate the form
    document.getElementById('edit-expense-id').value = expense.id;
    document.getElementById('edit-expense-name').value = expense.name;
    document.getElementById('edit-expense-amount').value = expense.amount;
    document.getElementById('edit-expense-category').value = expense.category;
    document.getElementById('edit-expense-date').value = new Date(expense.date).toISOString().split('T')[0];
    document.getElementById('edit-expense-notes').value = expense.notes || '';
    
    // Show the modal
    document.getElementById('edit-modal').style.display = 'block';
  } catch (error) {
    console.error('Error opening edit modal:', error);
    showNotification('Failed to load expense details', 'error');
  }
}

/**
 * Update the summary section
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
async function updateSummary(startDate, endDate) {
  try {
    const stats = await expenseDB.getSummaryStats(startDate, endDate);
    
    // Update the total amount
    document.getElementById('total-amount').textContent = `₹${stats.total.toFixed(2)}`;
    
    // Additional summary info could be added here
  } catch (error) {
    console.error('Error updating summary:', error);
  }
}

// Variable to store chart instance
let expenseChart;

/**
 * Initialize the chart
 */
function initChart() {
  const ctx = document.getElementById('expense-chart').getContext('2d');
  
  // Determine if we're in dark mode
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Set grid and text colors based on theme
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDarkMode ? '#e0e0e0' : '#666';
  
  expenseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Expenses',
        data: [],
        backgroundColor: 'rgba(74, 111, 165, 0.7)',
        borderColor: 'rgba(74, 111, 165, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor
          },
          ticks: {
            callback: (value) => `₹${value}`,
            color: textColor
          }
        },
        x: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `₹${context.raw.toFixed(2)}`
          }
        }
      }
    }
  });
}

/**
 * Update the chart with new data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
async function updateChart(startDate, endDate) {
  try {
    const stats = await expenseDB.getSummaryStats(startDate, endDate);
    const timeframe = document.getElementById('timeframe').value;
    
    if (timeframe === 'daily') {
      // For daily view, show expenses by category
      updateCategoryChart(stats.categories);
    } else {
      // For weekly/monthly view, show expenses by day
      updateDateChart(stats.dailyData, startDate, endDate);
    }
  } catch (error) {
    console.error('Error updating chart:', error);
  }
}

/**
 * Update chart to show expenses by category
 * @param {Object} categories - Categories data
 */
function updateCategoryChart(categories) {
  const labels = Object.keys(categories).map(cat => capitalizeFirstLetter(cat));
  const data = Object.values(categories);
  
  // Define colors for categories
  const backgroundColors = labels.map(label => {
    const categoryColors = {
      'Food': 'rgba(255, 206, 86, 0.7)',
      'Transportation': 'rgba(75, 192, 192, 0.7)',
      'Utilities': 'rgba(54, 162, 235, 0.7)',
      'Entertainment': 'rgba(153, 102, 255, 0.7)',
      'Shopping': 'rgba(255, 159, 64, 0.7)',
      'Health': 'rgba(255, 99, 132, 0.7)',
      'Housing': 'rgba(199, 199, 199, 0.7)',
      'Other': 'rgba(83, 83, 83, 0.7)'
    };
    
    return categoryColors[label] || 'rgba(74, 111, 165, 0.7)';
  });
  
  // Update chart
  expenseChart.data.labels = labels;
  expenseChart.data.datasets[0].data = data;
  expenseChart.data.datasets[0].backgroundColor = backgroundColors;
  expenseChart.options.scales.x.title = {
    display: true,
    text: 'Categories'
  };
  expenseChart.update();
}

/**
 * Update chart to show expenses by date
 * @param {Object} dailyData - Daily data
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
function updateDateChart(dailyData, startDate, endDate) {
  // Create an array of dates between startDate and endDate
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Format dates for labels and get data for each date
  const labels = dates.map(date => date.toLocaleDateString());
  const data = dates.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    return dailyData[dateStr] || 0;
  });
  
  // Update chart
  expenseChart.data.labels = labels;
  expenseChart.data.datasets[0].data = data;
  expenseChart.data.datasets[0].backgroundColor = 'rgba(74, 111, 165, 0.7)';
  expenseChart.options.scales.x.title = {
    display: true,
    text: 'Date'
  };
  expenseChart.update();
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - Type of notification (success, error)
 */
function showNotification(message, type) {
  // Check if a notification container exists
  let notificationContainer = document.querySelector('.notification-container');
  
  // Create container if it doesn't exist
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
    
    // Style the container
    Object.assign(notificationContainer.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '1000'
    });
  }
  
  // Create the notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
    color: 'white',
    padding: '12px 20px',
    marginBottom: '10px',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    opacity: '0',
    transition: 'opacity 0.3s ease'
  });
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Toggle between light and dark themes
 */
function toggleDarkMode() {
  // Add a transition class
  document.body.classList.add('theme-transition');
  
  // Get current theme
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  // Toggle theme
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Save preference to localStorage
  localStorage.setItem('theme', newTheme);
  
  // Update toggle button text
  updateDarkModeToggleText(newTheme);
  
  // Update chart for dark mode
  updateChartForTheme(newTheme);
  
  // Remove transition class after animation completes
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 500);
}

/**
 * Update the dark mode toggle button text based on theme
 * @param {string} theme - The current theme ('dark' or 'light')
 */
function updateDarkModeToggleText(theme) {
  const toggleButton = document.getElementById('dark-mode-toggle');
  const toggleText = toggleButton.querySelector('.toggle-text');
  
  if (theme === 'dark') {
    toggleText.textContent = 'Light Mode';
    toggleButton.querySelector('i').classList.remove('fa-moon');
    toggleButton.querySelector('i').classList.add('fa-sun');
  } else {
    toggleText.textContent = 'Dark Mode';
    toggleButton.querySelector('i').classList.remove('fa-sun');
    toggleButton.querySelector('i').classList.add('fa-moon');
  }
}

/**
 * Update chart appearance based on theme
 * @param {string} theme - The current theme ('dark' or 'light')
 */
function updateChartForTheme(theme) {
  if (!expenseChart) return;
  
  if (theme === 'dark') {
    expenseChart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
    expenseChart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
    expenseChart.options.scales.x.ticks.color = '#e0e0e0';
    expenseChart.options.scales.y.ticks.color = '#e0e0e0';
  } else {
    expenseChart.options.scales.x.grid.color = 'rgba(0, 0, 0, 0.1)';
    expenseChart.options.scales.y.grid.color = 'rgba(0, 0, 0, 0.1)';
    expenseChart.options.scales.x.ticks.color = '#666';
    expenseChart.options.scales.y.ticks.color = '#666';
  }
  
  expenseChart.update();
}
