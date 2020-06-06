const mongoose = require('mongoose');
const validator = require('validator');
const bcrypyt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var uniqueValidator = require('mongoose-unique-validator');//makes unique:true valid to check for duplications in db

const Task = require('./task.js');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Age cannot be negative');
            }
        }
    },
    email : {
        type: String,
        unique: true,//checks duplication of email.. place it at 2nd
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes("password")) {
                throw new Error('Password cannot contain "password"');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, 
{
    timestamps: true
});
userSchema.plugin(uniqueValidator);

userSchema.virtual('tasks', {//creates a virtual attribute which defines a relation with the task model
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


userSchema.methods.toJSON = function() {//Controls what we expose while sending response back
    const user = this;

    const userObject = user.toObject();//Creates raw object data removing all mongoose functions;

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);//jwt.sign(object, secret code)
    user.tokens = user.tokens.concat({token});//here concat means pushing an obj into the array
    await user.save();              
    return token;
}

userSchema.statics.findByCredentials = async(email, password) => {
    const user = await User.findOne({email});//verify email

    if(!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypyt.compare(password, user.password);//verify password

    if(!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
}

//hash user password
userSchema.pre('save', async function(next) {//here we use normal function because in arrow function  doesnt bind this
    const user = this; //Here this is the current user document we are saving
    if(user.isModified('password')) { //run if the user is created or user want to change the password
        user.password = await bcrypyt.hash(user.password, 8);
    }
    next();
});

userSchema.pre('remove', async function(next) {
    const user = this;
    await Task.deleteMany({owner: user._id});
    next();
});

const User = mongoose.model('User', userSchema); //Schema is created to use middleware functions

module.exports = User;