var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

passport.use('local.signup',new LocalStrategy({
    usernameField:'email',
    passwordField:'password',
    passReqToCallback:true
},(req,email,password,done)=>{
    User.findOne({'email':email.toLowerCase()},function(err,user){
        if(err)
        return done(err);
        if(user){
            return done(null,false,{message:'Email is already in use'});
        }
        var newUser = new User();
        newUser.email = email.toLowerCase();
        newUser.name = req.body.name;
        newUser.address.street = req.body.address;
        newUser.address.pincode = req.body.pincode;
        newUser.password = newUser.encryptPassword(password);
        newUser.save((err,result)=>{
            if(err)
            return done(err);
            return done(null,newUser);
        });
    });
}
));


passport.use('local.login',new LocalStrategy({
    usernameField:'email',
    passwordField:'password',
    passReqToCallback:true
}, function(req,email,password,done){
    User.findOne({'email':email.toLowerCase()},function(err,user){
        if(err)
        return done(err);
        if(!user){
            return done(null,false,{message:'No user found'});
        }
        if(!user.validPassword(password)){
            return done(null,false,{message:'Wrong Password'})
        }
        return done(null,user);
    });
}));

passport.serializeUser(function(user,done){
    done(null,user.id);
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});