# 🥤 Office Beverage Ordering System (辦公室飲料訂購系統)

An elegant, modern React & Vite web application designed for office drink group orders. It features a responsive dynamic menu, customizable drink configurations (sweetness, ice, toppings), real-time order state tracking, and seamless synchronization with a Google Sheets database via a Google Apps Script web app API.

---

## ✨ Features

- **Dynamic Menu Display**: Sleek presentation categorized by drink series with live search filtering.
- **Customizable Orders**: Simple interface for selecting sweetness levels, ice levels, and multiple toppings with automatic subtotal calculation.
- **Order Analytics**: Real-time summary showing total cups ordered, overall total price, and unique participants.
- **Google Sheets Sync**: Integrated directly with Google Apps Script to save, edit, and delete orders in a central spreadsheet.
- **Offline / Local Sandbox Mode**: Graceful degradation to local state simulation when the remote database is unreachable.
- **Group Summary Copy**: Single-click button to copy a beautifully formatted text summary of all orders for sharing in group chat rooms (Slack, Line, Teams, etc.).

---

## 🛠️ Development & Deployment

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### Setup & Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Production build**:
   ```bash
   npm run build
   ```
   The static assets will be compiled into the `dist/` directory, ready to be deployed to any static host (GitHub Pages, Vercel, Netlify, etc.).

---

## 📂 Project Structure

- `src/App.tsx`: Main application component housing the business logic, state, styling, and API connections.
- `src/main.tsx`: Entry point for React 19.
- `src/index.css`: Global styles using Tailwind CSS.
- `vite.config.ts`: Vite bundler configuration.
- `tsconfig.json`: TypeScript compiler preferences.
