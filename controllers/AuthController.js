const AuthService = require('../service/AuthService');
require('dotenv').config();
const jwt = require('jsonwebtoken')

class AuthController {
    /**
     * @swagger
     * tags:
     *   name: Authentication
     *   description: Operations related to Authentications
     */

    /**
     * Register a new user.
     * 
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register a new user
     *     description: Register a new user with the provided details.
     *     tags:
     *       - Authentication
     *     requestBody:
     *       description: User data for registration.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 description: Email for the new user.
     *               name:
     *                 type: string
     *                 description: Name for the new user.
     *               password:
     *                 type: string
     *                 description: Password for the new user.
     *             example:
     *               email: newuser@example.com
     *               name: New User
     *               password: newPassword
     *     responses:
     *       201:
     *         description: User registered successfully.
     *         content:
     *           application/json:
     *             example:
     *               message: User registered successfully
     *               user:
     *                 _id: generatedUserId
     *                 email: newuser@example.com
     *                 name: New User
     */
    async register(req, res) {
        try{
            const user = await AuthService.register(req.body);
            const actionToken = await AuthService.createActionToken(user.id);
            const verificationSent = await AuthService.sendVerificationEmail(user.email, actionToken.id);

            res.status(201).json({
                message:'User created successfully', user, 
                message2:'Action token created successfully', actionToken,
                message3:'Email verification token sent successfully', verificationSent
            });
        }
        catch(error){
            if (error.code === 11000 && error.keyPattern && error.keyValue) {
                res.status(400).json({ error: 'Invalid data input' });
                
            } else {
                // General error
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    }

    /**
     * Log in a user.
     * 
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Log in a user
     *     description: Log in a user with the provided credentials.
     *     tags:
     *       - Authentication
     *     requestBody:
     *       description: User credentials for login.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 description: Email for the user.
     *               password:
     *                 type: string
     *                 description: Password for the user.
     *             example:
     *               email: blasko01@example.com
     *               password: "123456"
     *     responses:
     *       200:
     *         description: User logged in successfully.
     *         content:
     *           application/json:
     *             example:
     *               message: User logged in successfully
     *               token: generatedAuthToken
     */
    async login(req,res){
        try {
            
            if (req && req.cookies && req.cookies.jwtAuthToken) {
                const decoded = jwt.decode(req.cookies.jwtAuthToken);
                
                // Check if the token is not expired
                if (decoded && decoded.exp * 1000 > Date.now()) {
                    return res.status(409).json({ message: 'User already logged in' });
                } 
            }

            const {user, token, passwordMatch} = await AuthService.login(req.body);
    
            // Check if the user with the provided email exists
            if (!user) {
                return res.status(401).json({ error: 'Invalid email' });
            }

            if(user.email_verified_at === null){
                return res.status(401).json({ error: 'You have to verify your email before logging in' });
            }

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            res.cookie('jwtAuthToken', token, { httpOnly: true, secure: false });
            res.status(200).json({ token });
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Logout a user.
     * 
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout a user
     *     description: Logout a user by clearing the JWT authentication token stored in the cookie.
     *     tags:
     *       - Authentication
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       '200':
     *         description: Successful logout
     *         content:
     *           application/json:
     *             example:
     *               message: Logout successful
     *       '401':
     *         description: User not logged in
     *         content:
     *           application/json:
     *             example:
     *               error: User not logged in
     *       '500':
     *         description: Internal server error
     *         content:
     *           application/json:
     *             example:
     *               error: Internal server error
     */
    async logout(req,res){
        try{

            if(req.cookies.jwtAuthToken == null){
                return res.status(401).json({ error: 'User not logged in'});
            }

            res.clearCookie('jwtAuthToken');

            res.status(200).json({message: 'Logout successful'});
        }
        catch(error){
            res.status(500).json({error: 'Internal server error'});
        }
    }

/**
 * Verify email.
 * 
 * @swagger
 * /auth/verify-email/{action_token_id}:
 *   get:
 *     summary: Verify email
 *     description: Verify email using the action token.
 *     tags:
 *       - Authentication
 *     parameters:
 *       - in: path
 *         name: action_token_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the action token for email verification.
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *         content:
 *           application/json:
 *             example:
 *               message: Email verified successfully
 *               verified: { updated_field1: value1, updated_field2: value2, ... }
 *       401:
 *         description: Unauthorized or verification request invalid/expired.
 *         content:
 *           application/json:
 *             example:
 *               error: Invalid verification request
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */

    async verifyEmail(req,res){
        try{
            const actionTokenId = req.params.action_token_id;
            const dateNow = new Date();
            const actionToken = await AuthService.findActionToken(actionTokenId);

            if(!actionToken){
                return res.status(401).json({error: 'Invalid verification request'});
            }

            if(actionToken.executed_at != null){
                return res.status(401).json({error: 'Email already verified'});
            }

            if(dateNow > actionToken.expires_at){
                return res.status(401).json({error: 'Verification request has expired'});
            }

            const verified = await AuthService.verified(dateNow,actionToken.entity_id);
            res.status(200).json({message: 'Email verified successfully', verified: verified});
        }
        catch(error){
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * Resend email verification.
     * 
     * @swagger
     * /auth/verifyEmail/resend:
     *   get:
     *     summary: Resend email verification
     *     description: Resend email verification to the user.
     *     tags:
     *       - Authentication
     *     requestBody:
     *       description: User credentials for login and resend request.
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 description: Email for the user.
     *               password:
     *                 type: string
     *                 description: Password for the user.
     *             example:
     *               email: blasko01@example.com
     *               password: "userPassword123"
     *     responses:
     *       201:
     *         description: Email verification resent successfully.
     *         content:
     *           application/json:
     *             example:
     *               message: Email verification resent successfully
     *               actionToken: { action_token_details }
     *               verificationSent: { verification_sent_details }
     *       401:
     *         description: Unauthorized or invalid credentials.
     *         content:
     *           application/json:
     *             example:
     *               error: Invalid email or password
     *       500:
     *         description: Internal Server Error.
     *         content:
     *           application/json:
     *             example:
     *               error: Internal Server Error
     */

    async resendVerificationEmail(req,res){
        try{

            const {user, passwordMatch} = await AuthService.validateLoginForResend(req.body);

            if (!user) {
                return res.status(401).json({ error: 'Invalid email' });
            }

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            if(user.email_verified_at != null){
                return res.status(401).json({error: 'Email already verified'});
            }

            const actionToken = await AuthService.createActionToken(user.id);
            const verificationSent = await AuthService.sendVerificationEmail(user.email, actionToken.id);
            res.status(201).json({ 
                message:'Action token created successfully', actionToken,
                message2:'Email verification resent', verificationSent
            }); 
        }
        catch(error){
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new AuthController();