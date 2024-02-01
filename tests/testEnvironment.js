const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const ShortUrlController = require('../controllers/ShortUrlController.js');
const AuthValidation = require ('../validations/AuthValidation');
const UserValidation = require ('../validations/UserValidation');
const ShortUrlValidation = require ('../validations/ShortUrlValidation');
const LongUrlValidation = require('../validations/LongUrlValidation.js');
const authenticateToken = require('../middleware/jwtMiddleware');
const cookieParser = require('cookie-parser');

const app = express();

//Middleware
app.use(bodyParser.json());
app.use(cookieParser());

//User routes
app.get('/users/:user_id',UserValidation.show, UserController.show);
app.put('/users/update/:user_id', UserValidation.update, authenticateToken, UserController.update);

//Auth routes
app.get('/auth/verify-email/:action_token_id', AuthValidation.verifyEmail, AuthController.verifyEmail);
app.get('/auth/resend-verification', AuthValidation.resend, AuthController.resendVerificationEmail);
app.post('/auth/register', AuthValidation.register, AuthController.register);
app.post('/auth/login', AuthValidation.login, AuthController.login);

//Url routes 
app.get('/url/show-long-url/:short_url', LongUrlValidation.longUrl, ShortUrlController.show);
app.get('/url/list', authenticateToken, ShortUrlController.list);
app.get('/url/:short_url', LongUrlValidation.longUrl, authenticateToken, ShortUrlController.redirect);
app.post('/url', ShortUrlValidation.createShortUrl, authenticateToken, ShortUrlController.create);
app.put('/url/update/:short_url_id', ShortUrlValidation.createShortUrl, authenticateToken, ShortUrlController.update);
app.delete('/url/delete/:short_url_id', authenticateToken, ShortUrlController.delete);

//Test route
app.get('/health', (req,res) => {
    res.send('I am healthy!');
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
});

module.exports = app;