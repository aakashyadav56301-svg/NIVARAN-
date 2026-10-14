# Nivaran — College Complaint Management Backend

A REST API backend for NIVARAN, a college student complaint management application. The system is designed to help students submit and manage complaints while allowing administrators to view and manage complaints according to their access permissions.

The frontend is built with "React Native and Expo", while the backend uses Node.js, Express.js, and MySQL.

## Features

- **User Authentication: Signup and login functionality.
- **Password Security: Password hashing using bcrypt.
- **JWT Authentication: Token-based authentication for protected API routes.
- **Role-Based Access Control: Separate permissions for students and administrators.
- **Complaint Management: Create, retrieve, update, and delete complaints according to user permissions.
- **Complaint Timestamps: Supports displaying complaint creation dates and times when the database contains the relevant timestamp.
- **Database Integration: MySQL database for application data.

## Tech Stack

| Technology | Purpose |
| React Native / Expo | Mobile application frontend |
| Node.js | JavaScript runtime |
| Express.js | Backend REST API |
| MySQL | Relational database |
| JWT | Authentication |
| bcrypt | Password hashing |
| dotenv | Environment variable configuration |

## Project Structure

```text
backend/
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── .env                 # Local configuration; not committed
└── README.md
```

The structure above describes the expected backend files. Additional files may exist in your project.

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js and npm
- MySQL Server
- Git
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/aakashyadav56301-svg/NIVARAN-.git
cd NIVARAN-
```

If the repository contains only the backend, you can proceed directly. Otherwise, navigate into the backend directory containing `server.js`.

### 2. Install Dependencies

Run:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory. Add the following variables and replace the example values with your local configuration.

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=complain
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

**Important:** The variable names above must match those used in `server.js`. Do not commit your `.env` file, real database passwords, or JWT secrets to GitHub.

### 4. Configure MySQL

Create or configure the MySQL database and tables required by the backend.

The application uses a `students` table for complaint records, with fields discussed during development including:

- `id`
- `user_id`
- `name`
- `complain`
- `description`
- `created_at` (if configured)

The authentication functionality also requires a user table with the fields expected by the signup and login routes.

**Before deploying, verify the exact table definitions, column types, constraints, and default values against your current `server.js` and MySQL database.** This README does not define a complete database schema.

### 5. Start the Backend

If your `package.json` defines a suitable start script, use:

```bash
npm start
```

Otherwise, if `server.js` is the entry point, you can start it using:

```bash
node server.js
```

Use the port configured in your environment variables. If the server starts successfully, check the appropriate API route or health endpoint defined in your code.

## API Documentation

The following routes reflect the endpoints discussed during development. **Verify their HTTP methods, middleware, and request/response formats against the current `server.js` before relying on this table.**

| Method | Endpoint | Purpose / Access |
|---|---|---|
| POST | `/signup` | Register a user |
| POST | `/login` | Authenticate a user and receive a token |
| POST | `/munna` | Create a complaint; authenticated student |
| GET | `/munna` | Retrieve complaints; administrator access |
| PUT | `/munna/:id` | Update an owned complaint; authenticated student |
| DELETE | `/munna/:id` | Delete a complaint according to role and ownership permissions |
| GET | `/admin/complaints` | Retrieve complaints for administrators |
| GET | `/munna/user/:user_id` | Retrieve complaints for a user, subject to authorization |

### Authentication

Protected routes use a JWT access token sent in the HTTP `Authorization` header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The backend verifies the token and uses the authenticated user's identity and role to enforce access permissions.

Never publish a real access token in this README or in source control.

## Connecting the React Native / Expo App

The mobile app communicates with the backend through HTTP requests.

For local development:

1. Start the backend on your computer.
2. Find your computer's local IPv4 address.
3. Configure the API base URL in the Expo app using that address and the backend port.
4. Keep your computer and mobile device on the same Wi-Fi network when using Expo Go over a local network.
5. Ensure your firewall allows connections to the backend port.

For example, if your computer's local address is `192.168.1.10` and the backend listens on port `3000`, the base URL would be:

```text
http://192.168.1.10:3000
```

Replace this example with your actual address and port. Do not use `localhost` as the mobile device's backend address when the backend is running on your computer—on the phone, `localhost` refers to the phone itself.

For production deployment, use an appropriately secured HTTPS API URL.

## Security Considerations

- Store credentials and JWT secrets in environment variables.
- Keep `.env` excluded from Git using `.gitignore`.
- Hash passwords with bcrypt; never store plaintext passwords.
- Validate incoming request data.
- Enforce authentication, authorization, and complaint ownership on protected routes.
- Use HTTPS in production.
- Use a database account with only the permissions the application needs.
- Rotate any credential that has been accidentally exposed.

## Current Project Status

This repository contains the Nivaran backend developed for the college complaint management application. Database configuration, deployment details, exact request/response examples, and a complete verified schema can be documented as those details are finalized.

## Future Improvements

- API validation and standardized error responses
- Automated backend tests
- API documentation with request and response examples
- Production deployment and monitoring
- Improved logging and security configuration

## Author

**Aakash Yadav**

GitHub: [aakashyadav56301-svg](https://github.com/aakashyadav56301-svg)

*This project is intended for learning and development. Verify database configuration, API permissions, and deployment security before using it in production.*
