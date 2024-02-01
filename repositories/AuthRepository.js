const User = require('../models/User');

class AuthRepository {
  async create(userData) {
    const { name, email, password} = userData;

    const newUser = new User({ name, email, password});
    
    return await newUser.save();
  }

  async getUserByEmail(email){
    const user = await User.findOne({ email });
    return user;
  }
}

module.exports = new AuthRepository();
