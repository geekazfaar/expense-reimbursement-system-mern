# Expense Reimbursement System

A full-stack MERN application where employees submit expense claims with
receipts and administrators approve or reject them against annual
category budgets.

## Features

**Employee** - Register and log in. - Manage profile. - Submit claims
with receipts, track status, and cancel pending claims. - View remaining
annual budget per category. - Comment on claims and view dashboard
statistics.

**Administrator** - Manage employees (add, edit, search, deactivate). -
Manage categories and annual budgets. - View and filter all claims,
approve or reject them with a reason. - View receipts, comments, and
dashboard statistics.

## Tech Stack

-   **Frontend:** React, Redux Toolkit, React Router, Vite
-   **Backend:** Node.js, Express, JWT, bcrypt, Multer
-   **Database:** MongoDB with Mongoose

### Packages

Exact versions are listed in each `package.json`.

-   **Backend:** `express`, `mongoose`, `bcrypt`, `jsonwebtoken`,
    `cors`, `dotenv`, `multer`, `nodemon` (dev)
-   **Frontend:** `react`, `react-dom`, `@reduxjs/toolkit`,
    `react-redux`, `react-router-dom`, `vite`, `@vitejs/plugin-react`,
    ESLint with `eslint-plugin-react-hooks` and
    `eslint-plugin-react-refresh` (dev)

## Architecture

``` text
React (Redux Toolkit, React Router, Vite)
        | HTTP / JSON
Express API (routes -> middleware -> controllers)
        | Mongoose
MongoDB (users, claims, categories, budgets, attachments, comments)
```

Request flow:

1.  The user acts in the React frontend.
2.  The frontend sends an HTTP request to the Express API.
3.  Middleware handles authentication, authorization, and file uploads.
4.  The controller validates the request and uses Mongoose to query or
    update MongoDB.
5.  The API returns a JSON response.
6.  The frontend updates the displayed data.

## Project Structure

``` text
expense-reimbursement-mern/
├── backend/
│   ├── src/
│   │   ├── controllers/   business logic and database operations
│   │   ├── middleware/    authentication, authorization, uploads
│   │   ├── models/        Mongoose models
│   │   ├── routes/        API endpoints
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/           receipt files
│   ├── .env               local environment variables (do not commit)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         authentication, employee, and admin pages
│   │   ├── redux/         global state
│   │   └── ...
│   └── package.json
└── README.md
```

Folder names may vary slightly from this outline; check the current
repository if something differs.

## Getting Started

**Requirements:** Node.js, npm, MongoDB Community Server, Git. MongoDB
Compass and Postman are optional but useful.

``` bash
git clone <your-repository-url>
cd expense-reimbursement-mern
```

### 1. Database

Start your local MongoDB server. This project has been configured to use
a single-node replica set named `rs0` because transaction-based
operations require a replica set or sharded cluster.

The application database is `expense_reimbursement_mern`.

Example connection string:

``` text
mongodb://127.0.0.1:27017/expense_reimbursement_mern?replicaSet=rs0
```

If the replica set has not been initialized, transaction-based
operations may fail until it is configured and has a primary member.

To inspect the database, open MongoDB Compass and connect to:

``` text
mongodb://127.0.0.1:27017
```

### 2. Backend

``` bash
cd backend
npm install
```

Create `backend/.env`:

``` env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/expense_reimbursement_mern?replicaSet=rs0
JWT_SECRET=replace_with_a_long_random_secret
```

Use the exact environment variable names expected by the current backend
code. Add any additional variables your local setup requires.

Start the backend:

``` bash
npm start
```

If the `package.json` defines a development script and you prefer it,
use that script instead (for example, `npm run dev`).

The API is expected to run at `http://localhost:5001`.

### 3. Frontend

Open a second terminal from the project root:

``` bash
cd frontend
npm install
npm run dev
```

Vite usually serves the frontend at `http://localhost:5173`. If that
port is busy, Vite may select another port and print the actual URL in
the terminal.

Keep MongoDB, the backend, and the frontend running while developing.

## API Overview

Protected routes require `Authorization: Bearer <token>`. Administrator
routes also require an administrator account. Check the route files for
the exact HTTP methods and permissions.

  ------------------------------------------------------------------------------------------------
  Endpoint                               Method            Access                Purpose
  -------------------------------------- ----------------- --------------------- -----------------
  `/api/auth/register`                   POST              Public                Register an
                                                                                 account

  `/api/auth/login`                      POST              Public                Log in and
                                                                                 receive a JWT

  `/api/users`                           Varies by route   Authenticated/Admin   User and employee
                                                                                 operations

  `/api/categories`                      GET               Authenticated         List categories

  `/api/categories`                      POST              Admin                 Create a category

  `/api/categories/:id`                  Varies by route   Admin                 Update a category

  `/api/budgets`                         GET               Authenticated         Retrieve annual
                                                                                 budgets

  `/api/budgets`                         PUT               Admin                 Create or update
                                                                                 a category annual
                                                                                 budget

  `/api/claims`                          GET, POST         Authenticated         List own claims
                                                                                 or submit a claim

  `/api/claims/admin/all`                GET               Admin                 List all claims

  `/api/claims/:id/approve`              PATCH             Admin                 Approve a claim

  `/api/claims/:id/reject`               PATCH             Admin                 Reject a claim

  `/api/claims/:id/cancel`               PATCH             Claim owner           Cancel an
                                                                                 eligible pending
                                                                                 claim

  `/api/claims/receipts/:attachmentId`   GET               Authenticated,        Retrieve a
                                                           subject to            receipt
                                                           authorization         

  `/api/comments`                        Check route file  Authenticated         Comment-related
                                                                                 operations

  `/api/db-test`                         GET               Development/test      Check database
                                                                                 connectivity
  ------------------------------------------------------------------------------------------------

The API list is a practical overview based on the routes used during
development. Verify route methods and access levels against the current
source before relying on it as exhaustive documentation.

## Business Rules

-   Claim statuses include `PENDING`, `APPROVED`, `REJECTED`, and
    `CANCELLED`.
-   Claim submissions validate category and expense details on the
    backend.
-   Only eligible pending claims should be approved, rejected, or
    cancelled.
-   Approved claims are included in approved spending calculations
    against annual category budgets.
-   Receipt uploads are handled by Multer; the current claim route
    accepts up to five files per submission.
-   Employees should access only their own claims and authorized
    receipts.
-   Passwords should be hashed with bcrypt; inactive accounts should not
    be allowed to log in.
-   Protected API endpoints require JWT authentication and role-based
    authorization where applicable.

Check the current controller and middleware code for exact validation
limits, allowed receipt formats and sizes, and all role-specific rules.

## API Testing with Postman

1.  Start MongoDB and the backend.
2.  Register an account or log in with an existing account.
3.  Copy the JWT returned by login.
4.  For protected requests, choose **Authorization → Bearer Token** and
    paste the token.
5.  Test endpoints and verify the response status and JSON body before
    integrating them with the frontend.

## Security Notes

-   Never commit `.env`, JWT secrets, database credentials, or private
    receipt files.
-   Do not expose employee information or uploaded receipts in a public
    repository.
-   Keep backend validation and authorization in place even if the
    frontend validates inputs.
-   Use bcrypt password hashing and JWT verification as implemented in
    the backend.
-   For production, use appropriate secrets management, HTTPS,
    restricted database access, and private storage for uploaded
    receipts.

## Author

Azfaar Khan · [github.com/geekazfaar](https://github.com/geekazfaar)
