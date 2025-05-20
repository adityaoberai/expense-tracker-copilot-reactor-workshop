# Expense Tracker

A simple web-based expense tracker application that allows you to monitor and track your expenses on a daily, weekly, and monthly basis. The application uses IndexedDB for local data storage so all your data is stored locally in your browser.

## Features

- **Add Expenses**: Record expenses with details like amount, category, date, and notes
- **Track Over Time**: View expenses on a daily, weekly, or monthly basis
- **Visualize Data**: See your spending patterns with charts
- **Filter & Sort**: Easily find expenses by category or sort them by date and amount
- **Full CRUD Operations**: Add, view, edit, and delete expense entries
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Getting Started

1. Open `index.html` in your web browser
2. Start adding your expenses using the form
3. Switch between daily, weekly, and monthly views to track your spending over time

## How to Use

### Adding Expenses

1. Fill out the "Add Expense" form with:
   - Description (what you spent money on)
   - Amount (how much it cost)
   - Category (type of expense)
   - Date (when the expense occurred)
   - Notes (optional additional details)
2. Click "Add Expense" to save it

### Viewing & Filtering Expenses

- Use the dropdown at the top to switch between daily, weekly, and monthly views
- Select dates to view expenses for specific time periods
- Use the category filter to show only certain types of expenses
- Sort expenses by date or amount using the sort dropdown

### Editing & Deleting Expenses

- Click the edit icon on any expense to modify or delete it
- Make your changes in the popup modal and click "Save Changes" or "Delete Expense"

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses IndexedDB for local data storage
- Visualizations created with Chart.js
- No server or backend required - all data is stored in your browser

## Privacy

Since this application uses IndexedDB for storage, all your expense data remains on your local device and is not shared with any external servers.

## Requirements

- Modern web browser with IndexedDB support (Chrome, Firefox, Safari, Edge)
- JavaScript enabled

## License

This project is open source and available for personal use.
