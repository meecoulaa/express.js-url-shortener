const { body, validationResult } = require('express-validator');
class ShortUrlValidation {
    createShortUrl(req, res, next) {
        const validationRules = [
            body('longUrl').notEmpty().withMessage('Long URL is required'),
            body('shortUrl').notEmpty().withMessage('Short URL is required'),
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
module.exports = new ShortUrlValidation();
