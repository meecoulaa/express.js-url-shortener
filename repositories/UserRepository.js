const User = require('../models/User');

class UserRepository {
  async getById(userId){
    const user = await User.findById(userId);
    return user;
  }

  async updateUser(userId, userData){
    const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $set: userData },
        { new: true }
    );
    return updatedUser;
  }

  async updateEmailVerifiedAt(dateNow, userId){
    const updateEmailVerifiedAt = await User.findOneAndUpdate(
        { _id: userId },
        { $set: {email_verified_at:dateNow}},
        { new: true }
    );
    return updateEmailVerifiedAt;
  }
}


module.exports = new UserRepository();
