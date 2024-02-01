const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
    shortUrl: {
        type: String,
        required:true,
    },
    longUrl: {
        type: String,
        required:true,
    },
    userId: {
        type: String,
        required: true,
    },
});

const Url = mongoose.model('Url', shortUrlSchema);

module.exports = Url;