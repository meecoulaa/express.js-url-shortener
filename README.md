URL Shortener App
Overview
This is a simple URL shortener application built with Express.js and MongoDB. It provides an easy way to create shortened versions of long URLs, making them more convenient to share.

Setup
To run this application locally, make sure you have the following dependencies installed:

"dependencies": {
    "bcrypt": "^5.1.1",
    "body-parser": "^1.20.2",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "nodemailer": "^6.9.8",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "mongodb-memory-server": "^9.1.5",
    "supertest": "^6.3.4"
  }
Node.js
MongoDB

Installing Dependencies
bash
npm install

Environment Variables
Create a .env file in the root directory with the following variables:

env
HOST='http://localhost:3000'
PORT=3000
MONGODB_URI=mongodb://localhost:27017/your-database-name
JWTOKEN='your-secret-jwt-token'
# Add other environment variables as needed

Running the App
bash
npm start
The app will be accessible at http://localhost:3000.

Routes
User Routes
GET /users/:user_id: Retrieve user information.
PUT /users/update/:user_id: Update user information. Requires authentication.
Authentication Routes
GET /auth/verify-email/:action_token_id: Verify user email.
GET /auth/resend-verification: Resend email verification.
POST /auth/register: Register a new user.
POST /auth/login: Log in with existing credentials.
POST /auth/logout: Log out. Requires authentication.
URL Routes
GET /url/show-long-url/:short_url: Retrieve long URL using short URL.
GET /url/list: List all URLs for the authenticated user.
GET /url/:short_url: Redirect to long URL using short URL. Requires authentication.
POST /url: Create a new short URL. Requires authentication.
PUT /url/update/:short_url_id: Update a short URL. Requires authentication.
DELETE /url/delete/:short_url_id: Delete a short URL. Requires authentication.
Test Route
GET /health: Check the health of the server.
Contributing
Feel free to contribute to this project by opening issues or submitting pull requests.