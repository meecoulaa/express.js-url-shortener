const jwt = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.JWTOKEN || 'yJ1c2VySWQiOiI2NT6MTcwNDgwMzI5OX0.jJDo4Nfxao0INUaoy0uXOJnHWRyBCoyri8aZCXP7Byc';

function authenticateToken(req,res,next){
    let token = req.header.authorization;

    if(!token && req.cookies.jwtAuthToken){
        token = req.cookies.jwtAuthToken;
    }

    if(!token){
        return res.status(401).json({error: 'Unauthorized - Missing token'});
    }

    jwt.verify(token,secretKey, (err, user) => {
        if(err){
            return res.status(403).json({error: 'Forbidden - Invalid token'});
        }

        req.user = user;
        next();
    });
}

module.exports = authenticateToken;