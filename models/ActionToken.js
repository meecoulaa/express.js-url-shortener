const mongoose = require('mongoose');

const actionTokenSchema = new mongoose.Schema({
    entity_id: {
        type: String,
        required:true,
    },
    action_name: {
        type: String,
        required:true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    expires_at:{
        type:Date,
        default: () => Date.now() + 900000,
    },
    executed_at:{
        type:Date,
        default:null,
    },
});

const ActionToken = mongoose.model('ActionToken', actionTokenSchema);

module.exports = ActionToken;