const mongoose = require('mongoose');
require('./quotes').schema;

const addressSchema = new mongoose.Schema({
    address: String,
    quotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quote'
    }]
})

module.exports = mongoose.model('Address', addressSchema);