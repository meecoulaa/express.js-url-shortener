const { body,param, validationResult } = require('express-validator');
class AuthValidation {
    register(req, res, next) {
        const validationRules = [
            body('name').notEmpty().withMessage('Name is required'),
            body('email').isEmail().withMessage('Invalid email address'),
            body('password').notEmpty().withMessage('Password is required'),
        ];
        Promise.all(validationRules.map(rule => rule.run(req))).then(() => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        });
    }

    login(req,res,next){
        const validationRules = [
            body('email').isEmail().withMessage('Invalid email address'),
            body('password').notEmpty().withMessage('Password is required'),
        ];
        Promise.all(validationRules.map(rule => rule.run(req))).then(() => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        });
    }

    verifyEmail(req,res,next){
        const validationRules = [
            param('token').optional().notEmpty().withMessage('Token is required'),
        ];
        Promise.all(validationRules.map(rule => rule.run(req))).then(() => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        });
    }

    resend(req,res,next){
        const validationRules = [
            body('email').isEmail().withMessage('Invalid email address'),
            body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        ];
        Promise.all(validationRules.map(rule => rule.run(req))).then(() => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        });
        
    }
}
module.exports = new AuthValidation();
