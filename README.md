# StockLyser

**StockLyser** is a real-time financial tracking and screening web application for commodities and cryptocurrencies (Gold, Silver, and Bitcoin). It includes interactive chart visualizations powered by Chart.js and user authentication backed by an Express and MongoDB backend.

---

## Features

- **Live Market Tracking**: Real-time prices for Gold (XAU), Silver (XAG), and Bitcoin (BTC) fetched via live APIs.
- **Interactive Visualizations**: Dynamic time-series line charts rendered with `Chart.js` and `react-chartjs-2`.
- **User Authentication**: Secure sign-up and login workflows with password hashing using `bcryptjs` and MongoDB storage.
- **Responsive Layout**: Custom UI with theme support, navigation headers, footers, terms, and team details.

---

## Project Structure

```text
STOCKLYSER/
├── public/                 # Static assets (logos, icons, illustrations)
│   ├── chart.png
│   ├── gold.png
│   ├── silver.png
│   ├── bitcoin.png
│   ├── login.png
│   └── favicon.ico
├── Bitcoin.jsx             # Bitcoin page view
├── BitcoinDashboard.jsx    # Real-time Bitcoin chart and stats dashboard
├── GoldDashBoard.jsx       # Real-time Gold chart and stats dashboard
├── SilverDashBoard.jsx     # Real-time Silver chart and stats dashboard
├── about.css               # Styles for About Us view
├── aboutUs.jsx             # Team & project background page
├── footer.jsx              # Footer component
├── gold.jsx                # Gold page view
├── header.jsx              # Header navigation bar with auth status
├── homepage.jsx            # Landing page with asset selector
├── index.html              # HTML entry template for Vite
├── index.jsx               # React entry point with router configuration
├── login.css               # Styling for authentication forms
├── login.jsx               # User login form
├── package.json            # Scripts and project dependencies
├── reportWebVitals.js      # Performance metrics measurement
├── server.cjs              # Express backend server with MongoDB auth endpoints
├── setupTests.js           # Test configuration
├── signUp.jsx              # User registration form
├── silver.jsx              # Silver page view
├── style.css               # Global application styles
├── terms.css               # Styles for Terms and About pages
├── terms.jsx               # Terms and conditions page
├── vite.config.js          # Vite configuration
├── .env.example            # Environment variables example
└── .gitignore              # Git ignore rules
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally on default port `27017` (or remote connection)

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/PREETHI-T0511/STOCKLYSER-PREETHI.git
   cd STOCKLYSER
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure MongoDB is running:
   ```bash
   sudo systemctl status mongod
   # or
   mongod --dbpath /data/db
   ```

---

## Running the Application

### 1. Run Frontend & Backend Simultaneously
```bash
npm start
```

### 2. Run Individually

- **Frontend Client (Vite)**:
  ```bash
  npm run dev
  ```
  Accessible at [http://localhost:3000](http://localhost:3000)

- **Backend Server (Express)**:
  ```bash
  npm run server
  ```
  Runs on [http://localhost:5000](http://localhost:5000)

---

## Backend API Endpoints

| Method | Endpoint  | Description                         | Request Body                     |
| ------ | --------- | ----------------------------------- | -------------------------------- |
| `POST` | `/signUp` | Register a new user with hashed pass | `{ "email": "...", "password": "..." }` |
| `POST` | `/login`  | Authenticate an existing user       | `{ "email": "...", "password": "..." }` |
