const ActionToken = require('../models/ActionToken');

class ActionTokenRepository {
    async create(userId){
        const actionToken = await ActionToken.create({
            "entity_id": userId,
            "action_name": "verify_email"
        });
        return actionToken;
    }

    async findTokenById(actionTokenId){
        const actionToken = await ActionToken.findById(actionTokenId);
        return actionToken;
    }

    async updateExecutedAt(dateNow, userId){
        const updatedExecutedAt = await ActionToken.findOneAndUpdate(
            { entity_id: userId },
            { $set: {executed_at:dateNow}},
            { new: true }
        );
        return updatedExecutedAt;
      }

}

module.exports = new ActionTokenRepository();
