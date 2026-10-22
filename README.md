# MiniLedger — Personal Loan Tracker

A full-stack mobile application that empowers users to track personal money lent to friends, monitor due dates, receive overdue warnings, and record partial or full repayments with ease.

Built with a **React Native (Expo + TypeScript)** mobile frontend and a **Node.js (Express + TypeScript + MongoDB & Mongoose ODM)** backend.

---

## 📱 Features

- **Phone-Number Mock OTP Authentication**:
  - Secure phone number login with automated 6-digit OTP generation.
  - Development mock OTP console printing (never exposed in the HTTP response).
  - 5-minute OTP expiration and rate limiting / attempt lockout protection.
  - JWT token generation and storage via **Expo SecureStore**.
- **User-Scoped Loan Management**:
  - Complete isolation across user accounts (multi-tenant security).
  - Add loans with Friend's Name, Original Amount in INR (₹), Date Lent, Due Date, and optional Notes.
  - Quick Due Date presets (+1 week, +15 days, +1 month, +3 months).
  - Repayment progress bar and percentage tracking.
  - Automated status transitions: `pending` ➔ `partially repaid` ➔ `repaid` ➔ `overdue`.
- **Dashboard & Aggregated Summary**:
  - High-performance MongoDB aggregation pipeline (`GET /api/summary`).
  - Total Lent, Total Repaid, Outstanding Balance, and Overdue Amount alert strip.
  - Active and fully settled loan counters.
  - Real-time search by friend's name and tab filtering (`All`, `Active`, `Overdue`, `Repaid`).
  - Pull-to-refresh synchronization.
- **Partial & Full Repayments**:
  - Quick percentage shortcuts (`25%`, `50%`, `Pay Full`).
  - Overpayment validation (strictly blocks repayments exceeding remaining balance).
  - Confirmation dialog before submission.
  - Repayment installment history timeline.
- **Optional Receipt Attachment**:
  - Upload photo receipts / UPI payment screenshots using `expo-image-picker` and `multipart/form-data`.
  - Secure backend storage and user-scoped access control.
- **Automated Testing**:
  - 100% isolated test suite powered by **Jest**, **Supertest**, and **mongodb-memory-server** with zero external database dependencies.

---

## 🏛 Architecture & Project Structure

The project is structured as a monorepo containing the backend service and the mobile application:

```text
miniledger/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment config and MongoDB connection handler
│   │   ├── controllers/         # Auth, Loan, and Summary controllers
│   │   ├── middleware/          # JWT auth, Zod validation, error handling, rate limiting, multer
│   │   ├── models/              # User, Loan, and Otp Mongoose schemas
│   │   ├── routes/              # Express API route declarations
│   │   ├── services/            # Business logic and MongoDB aggregation pipeline
│   │   ├── utils/               # Status calculation helper and safe logger
│   │   ├── validators/          # Zod request validation schemas
│   │   ├── app.ts               # Express application initialization
│   │   └── server.ts            # Server entrypoint and graceful shutdown
│   ├── tests/                   # Automated integration tests (Jest + Supertest)
│   ├── .env.example             # Documented environment variable template
│   ├── package.json
│   └── tsconfig.json
├── mobile/
│   ├── src/
│   │   ├── api/                 # Axios HTTP client and API service modules
│   │   ├── components/          # Reusable UI components (Button, Input, StatusBadge, Cards)
│   │   ├── context/             # AuthContext (OTP flow, session restoration, logout)
│   │   ├── navigation/          # React Navigation Native Stack (Auth vs Main stack)
│   │   ├── screens/             # LoginScreen, DashboardScreen, AddLoanScreen, LoanDetailsScreen
│   │   ├── theme/               # Color palette and typography tokens
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # Currency/date formatters and SecureStore wrapper
│   ├── App.tsx                  # Application root provider
│   ├── app.json                 # Expo configuration
│   └── package.json
├── package.json                 # Monorepo convenience scripts
├── README.md                    # Setup and API documentation
└── .gitignore
```

---

## 🛠 Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x` or higher
- **MongoDB**: MongoDB Atlas connection string **or** local MongoDB (`mongodb://localhost:27017`).
  *(Note: For development without local MongoDB installed, the backend includes a built-in automatic embedded database fallback so you can run out-of-the-box!)*
- **Expo Go App** (optional): Installed on your physical Android or iOS device to test natively via QR code.

---

## ⚙️ Backend Installation & Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

   Configure the variables in `.env`:
   ```ini
   PORT=5000
   NODE_ENV=development

   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/miniledger
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/miniledger?retryWrites=true&w=majority

   JWT_SECRET=super_secret_jwt_key_miniledger_2026
   JWT_EXPIRES_IN=7d

   OTP_EXPIRY_MINUTES=5
   MAX_OTP_ATTEMPTS=5

   ALLOW_DEV_MOCK_OTP=true
   DEV_MOCK_OTP_CODE=123456

   UPLOAD_DIR=uploads
   MAX_FILE_SIZE_BYTES=5242880
   CORS_ORIGIN=*
   ```

4. **Run the backend development server**:
   ```bash
   npm run dev
   ```
   Or build and start the production bundle:
   ```bash
   npm run build
   npm start
   ```

---

## 📱 Mobile Application Installation & Setup

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Backend URL Configuration (Physical Phone vs Emulator vs Web)**:
   - **On Web (`npm run web`)**: Automatically connects to `http://localhost:5000/api`.
   - **On Android Emulator**: Automatically connects via `http://10.0.2.2:5000/api`.
   - **On a Physical Phone**:
     Open `mobile/src/api/client.ts` and set your computer's local network IP address:
     ```ts
     // Replace 192.168.1.X with your development machine's LAN IP:
     export let API_BASE_URL = 'http://192.168.1.15:5000/api';
     ```
     Ensure your phone and computer are connected to the same Wi-Fi network and firewall allows incoming connections on port 5000.

4. **Start the Expo development server**:
   ```bash
   npm start
   ```
   - Press **`w`** in the terminal to open in your web browser.
   - Press **`a`** to open in an Android Emulator.
   - Scan the displayed QR code with the **Expo Go** app on your physical Android/iOS phone.

---

## 🧪 Running Automated Tests

Run the complete test suite verifying authentication, loan management, calculations, overdue logic, aggregation summaries, and user isolation:

```bash
cd backend
npm test
```

### Test Coverage Highlights:
- ✅ **OTP Request & Verification**: Validates 6-digit generation, ensures OTP is never returned in response body, and tests JWT issuance.
- ✅ **Expired & Invalid OTP**: Rejects incorrect codes, decrements attempts, and locks out when max attempts are reached.
- ✅ **Unauthorized API Access**: Protects `/api/loans` and `/api/summary` endpoints against unauthenticated requests.
- ✅ **Loan Validation**: Verifies rejection of non-positive amounts and invalid due dates earlier than lent date.
- ✅ **Partial & Full Repayments**: Updates balances and status accurately without rounding errors.
- ✅ **Overpayment Rejection**: Rejects repayments exceeding remaining outstanding balance.
- ✅ **Overdue Calculation**: Automatically identifies loans whose due date has passed with balance > 0.
- ✅ **Dashboard Summary Aggregation**: Computes totals and counts accurately, including zero-state handling.
- ✅ **Cross-User Data Isolation**: Verifies that User A cannot read, modify, or delete User B's loans.

---

## 🔐 Mock OTP Authentication Workflow

1. In the mobile app, enter any valid mobile number (e.g. `+919876543210` or `9876543210`).
2. Tap **Send Verification Code**.
3. Look at your backend server terminal to see the printed OTP code:
   ```text
   ======================================================
     [MOCK OTP CONSOLE] Verification for: +919876543210
     OTP CODE: 298477
     Valid for: 5 minutes
   ======================================================
   ```
4. Enter the code in the app (or use the fallback developer bypass `123456` if `ALLOW_DEV_MOCK_OTP=true`).
5. Tap **Verify & Continue**. You will be securely logged in and your JWT token will be saved in SecureStore.

---

## 📚 API Endpoint Documentation

All authenticated endpoints require the `Authorization: Bearer <token>` header.

### 1. Authentication

#### `POST /api/auth/otp/request`
Requests a 6-digit OTP for the provided phone number.
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Verification code sent. Please check your console in development mode."
  }
  ```

#### `POST /api/auth/otp/verify`
Verifies OTP code and returns a signed JWT token.
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210",
    "otp": "298477"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "6ad9a231c48928770f300093",
        "phoneNumber": "+919876543210",
        "createdAt": "2026-10-22T05:42:09.496Z"
      }
    }
  }
  ```

---

### 2. Dashboard Summary

#### `GET /api/summary`
Returns aggregated loan metrics for the authenticated user.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "totalLent": 17000,
      "totalRepaid": 4000,
      "outstandingAmount": 13000,
      "overdueAmount": 5000,
      "activeLoansCount": 2,
      "repaidLoansCount": 0
    }
  }
  ```

---

### 3. Loan Management

#### `POST /api/loans`
Create a new personal loan entry.
- **Request Body**:
  ```json
  {
    "friendName": "Vikram Aditya",
    "amount": 12000,
    "dateLent": "2026-10-22T00:00:00.000Z",
    "dueDate": "2026-11-05T00:00:00.000Z",
    "notes": "Shared room booking and travel tickets"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Loan entry created successfully",
    "data": {
      "_id": "6ad9a23bc48928770f300096",
      "friendName": "Vikram Aditya",
      "amount": 12000,
      "dateLent": "2026-10-22T00:00:00.000Z",
      "dueDate": "2026-11-05T00:00:00.000Z",
      "amountRepaid": 0,
      "outstandingBalance": 12000,
      "status": "pending",
      "notes": "Shared room booking and travel tickets",
      "repayments": []
    }
  }
  ```

#### `GET /api/loans`
List all loans for the authenticated user. Supports optional query parameters: `status`, `search`, `sortBy`, `sortOrder`.
- **Query Parameters**:
  - `status`: `'all' | 'pending' | 'partially repaid' | 'repaid' | 'overdue'`
  - `search`: string (case-insensitive friend's name search)
  - `sortBy`: `'dueDate' | 'amount' | 'createdAt' | 'friendName'`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 2,
    "data": [ ... ]
  }
  ```

#### `GET /api/loans/:id`
Retrieve details of a specific loan owned by the user.

#### `PATCH /api/loans/:id/repay`
Record a partial or full repayment.
- **Request Body**:
  ```json
  {
    "amount": 4000,
    "notes": "Paid via Google Pay"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Repayment recorded successfully",
    "data": {
      "_id": "6ad9a23bc48928770f300096",
      "amount": 12000,
      "amountRepaid": 4000,
      "outstandingBalance": 8000,
      "status": "partially repaid",
      "repayments": [
        {
          "amount": 4000,
          "date": "2026-10-22T05:42:45.954Z",
          "notes": "Paid via Google Pay"
        }
      ]
    }
  }
  ```

#### `DELETE /api/loans/:id`
Deletes a loan entry owned by the user.

#### `POST /api/loans/:id/receipt`
Uploads a receipt image attachment (`multipart/form-data`, field: `receipt`).

---

## 🔒 Security & Reliability Measures

- **No Secret Leaks**: JWT secret and database credentials are kept strictly in `.env`.
- **User Scoping**: Every database query includes `userId: req.user.id` to prevent cross-user data leakage.
- **Rate Limiting**: `express-rate-limit` prevents brute-force OTP verification and request flooding.
- **Input Validation**: Strict Zod schemas sanitize all incoming payloads before reaching controllers.
- **Safe Error Handling**: Centralized error middleware hides stack traces in production environments.
- **Graceful Shutdown**: Handles `SIGINT` and `SIGTERM` to close database connections gracefully.

---

## 📋 Feature Checklist

| Feature | Status | Notes |
| :--- | :---: | :--- |
| **Phone Login with Mock OTP** | ✅ Complete | Prints in server console, 5-minute expiry, rate limiting |
| **JWT Authentication** | ✅ Complete | Express middleware with token verification & user scoping |
| **Expo SecureStore Integration** | ✅ Complete | Secure token storage with web fallback |
| **Loan Management CRUD** | ✅ Complete | Create, list, details, repayments, delete |
| **Overdue Detection** | ✅ Complete | Dynamic overdue status check & red badge highlighting |
| **Dashboard Summary Aggregation** | ✅ Complete | MongoDB aggregation pipeline for financial totals |
| **Repayment Recording & Validation** | ✅ Complete | Partial/full repayments, overpayment blocking |
| **Receipt Photo Upload** | ✅ Complete | Multer multipart upload with image validation |
| **Automated Test Suite** | ✅ Complete | 22/22 Jest tests passing with in-memory MongoDB |
| **TypeScript End-to-End** | ✅ Complete | Zero compilation errors across backend & mobile |

---

## 📸 Demo Video & Screenshots

- **Demo Video URL**: `[Insert screen recording URL here]`
- **Screenshots**:
  - Screen A: Login & OTP Verification
  - Screen B: Dashboard & Financial Summary
  - Screen C: Add New Loan
  - Screen D: Loan Details, Repayment & Timeline

---

## 📄 License
MIT © 2026 MiniLedger Team
