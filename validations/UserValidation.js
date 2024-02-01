const { body,param, validationResult } = require('express-validator');
class UserValidation {
    show(req,res,next){
        const validationRules = [
            param('user_id').optional().notEmpty().withMessage('User ID is required'),
        ];
        
        Promise.all(validationRules.map(rule => rule.run(req))).then(() => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        });
    }

    update(req, res, next) {
        const validationRules = [
            body('name').optional().notEmpty().withMessage('Name cannot be empty'),
            body('email').optional().isEmail().withMessage('Invalid email address'),
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
module.exports = new UserValidation();
