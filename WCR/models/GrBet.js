const mongoose = require('mongoose');

let schema = mongoose.Schema({
    position1: {type: Number, required: true},
    position2: {type: Number, required: true},
    position3: {type: Number, required: true},
    position4: {type: Number, required: true},
    group: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Group'},
    author: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    date: {type: Date, default: Date.now()}
});

const GrBet = mongoose.model('GrBet', schema);

module.exports = GrBet;