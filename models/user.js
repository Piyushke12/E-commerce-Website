var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    address:{
        street: String,
        pincode:String,
    },
    resetPasswordToken:{type:String},
    resetPasswordExpires:{type:Date}
});

userSchema.methods.encryptPassword = function(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(5),null);
}

userSchema.methods.validPassword = function(password){
    return  bcrypt.compareSync(password,this.password);
}

module.exports = mongoose.model('User',userSchema);
