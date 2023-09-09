const mongoose = require('mongoose');

const quotesSchema = new mongoose.Schema({
    name: String,
    description: String,
    images: [{
        url: String,
        imageName: String
    }]
})

module.exports = mongoose.model('Quote', quotesSchema);