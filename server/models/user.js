const validator = require('validator');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        minlength: 3,
        required: true,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email',
            isAsync:false
        }
    },
    password: {
        type: String,
        require: true,
        minlength: 6
    },
    f_name: {
        type: String,
        minlength: 1
    },
    l_name: {
        type: String,
        minlength: 1
    },
    phone: {
        type: String,
        minlength: 10,
        maxlength: 10
    },
    address: {
        type: String,
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]

});

UserSchema.methods.toJSON = function () {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
}

UserSchema.methods.generateAuthToken = function () {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    user.tokens = user.tokens.concat([{access, token}]);

    console.log(user.tokens);

    return user.save().then(() => {
        return token;
    }).catch((err) => {
        return err;
    });
};

UserSchema.methods.removeToken = function (token) {
    var user = this;

    return user.update({
        $pull: {
            tokens: {
                token: token
            }
        }
    });
};

UserSchema.statics.findByToken = function (token) {
    var User = this;
    var decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
};

// find the user with email then check password
UserSchema.statics.findByCredentials = function (email, password) {
    var User = this;

    return User.findOne({email}).then((user) => {

        if (!user){
            return Promise.reject();
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    resolve(user);
                } else {
                    reject();
                }
            });
        });
    });
};

// runs everytime before saving to db
UserSchema.pre('save', function (next){
    var user = this;

    // check if password is modified, if so return true
    if (user.isModified('password')){
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    } else {
        next();
    }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};