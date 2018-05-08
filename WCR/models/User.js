const mongoose = require('mongoose');
const encryption = require('./../utilities/encryption');

let userSchema = mongoose.Schema(
    {
        userName: {type: String, required: true, unique: true},
        passwordHash: {type: String, required: true},
        name: {type: String, required: true},
        bets: {type: [mongoose.Schema.Types.ObjectId], default: []},
        salt: {type: String, required: true},
        admin: {type: Boolean, default: false}
    }
);

userSchema.method ({
   authenticate: function (password) {
       let inputPasswordHash = encryption.hashPassword(password, this.salt);
       let isSamePasswordHash = inputPasswordHash === this.passwordHash;

       return isSamePasswordHash;
   }
});

const User = mongoose.model('User', userSchema);

module.exports = User;



