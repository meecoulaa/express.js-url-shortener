const { param, validationResult } = require('express-validator');
class LongUrlValidation {
    longUrl(req, res, next) {
        const validationRules = [
            param('short_url').optional().notEmpty().withMessage('Short Url is required'),
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
module.exports = new LongUrlValidation();
