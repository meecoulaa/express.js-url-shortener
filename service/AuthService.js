const AuthRepository = require('../repositories/AuthRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ActionToken = require('../models/ActionToken');
const ActionTokenRepository = require('../repositories/ActionTokenRepository');
const UserRepository = require('../repositories/UserRepository');
const nodemailer = require('nodemailer');
require('dotenv').config();

class AuthService {
    async hashPassword(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }


    async register(userData){
        const newUser = await AuthRepository.create({
            email: userData.email.toLowerCase(),
            name: userData.name,
            password: await this.hashPassword(userData.password),
            });
        
    return newUser;
    }

    async sendVerificationEmail(userEmail, actionToken){
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure:false,
            auth:{
                user:process.env.EMAIL_ETHERAL_USER,
                pass:process.env.EMAIL_ETHERAL_PASS,
            },
        });

        const msg = {
            from: '"Url shortener app" <urlShortenerApp@example.com',
            to: `${userEmail}`,
            subject: "Url shortener app: Verify your email",
            text:`link: ${process.env.HOST}/auth/verify-email/${actionToken}`,
            html: `<a href="${process.env.HOST}/auth/verify-email/${actionToken}">Click here to verify your email</a>`
        };

        let info = await transporter.sendMail(msg);
        //const verificationSent =  `Message sent: ${info.messageId}\nPreview URL: ${nodemailer.getTestMessageUrl(info)}`;

        return msg;

    }

    async createActionToken(userId){
        const newActionToken = await ActionTokenRepository.create(userId);

        return newActionToken;
    }

    async login(userData){
        const user = await AuthRepository.getUserByEmail(userData.email);
        // Generate a JWT token
        if(user && await bcrypt.compare(userData.password, user.password)){
            // Compare the provided password with the hashed password in the database +
            const token = jwt.sign({ userId: user._id }, process.env.JWTOKEN , { expiresIn: '1h' });
            return {user, token, passwordMatch:true};
        }
        return {user, token:null, passwordMatch:false};
    }

    async findActionToken(actionTokenId){
        const actionToken = await ActionTokenRepository.findTokenById(actionTokenId);

        return actionToken;
    }

    async verified(dateNow, userId){
        await UserRepository.updateEmailVerifiedAt(dateNow, userId);
        await ActionTokenRepository.updateExecutedAt(dateNow, userId);
        return true;
    }

    async validateLoginForResend(userData){
        const user = await AuthRepository.getUserByEmail(userData.email);
        if(user && await bcrypt.compare(userData.password, user.password)){
            return {user, passwordMatch:true};
        }
        return {user, passwordMatch:false}
    }
}

module.exports = new AuthService();
