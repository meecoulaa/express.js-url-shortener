const UserRepository = require('../repositories/UserRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
    async hashPassword(password) {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    async getById(userId){
        const user = await UserRepository.getById(userId);
        return user;
    }

    async update(userId, userData){
        if(userData.password != null)
            userData.password = await this.hashPassword(userData.password)
        
        return await UserRepository.updateUser(userId,userData);
    }
}

module.exports = new UserService();
