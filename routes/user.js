var express = require('express');
var router = express.Router();
var csrf = require('csurf');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const { isLoggedIn, notLoggedIn } = require('../config/auth');
var Order = require('../models/order');
var Cart = require('../models/cart');
var User = require('../models/user');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const checkAuth = require('../config/check-auth');

var csrfProtection = csrf({ cookie: true });
router.use(csrfProtection);

//User Profile
router.get('/profile', isLoggedIn,checkAuth, function (req, res) {
  Order.find({ 'user': req.user }, function (err, orders) {
    if (err) {
      console.log(err);
    }
    var cart;
    orders.forEach(order => {
      cart = new Cart(order.cart);
      order.items = cart.generateArray();
    });
    var msg = req.flash('profilemessage');
    res.render('user/profile', { orders: orders,user:req.user,msg:msg })
  });
});

//Get signup Page
router.get('/signup', notLoggedIn, csrfProtection, (req, res, next) => {
  var messages = req.flash('error')
  res.render('user/signup', { data: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 })
});

//User Register
router.post('/signup', [
  body('name').trim().isLength({min:7}).escape().blacklist(';').withMessage('Invalid Username'),
  body('password').trim().isLength({ min: 8 }).isAlphanumeric().escape().blacklist(';').withMessage('Invalid Password'),
  body('email').trim().isEmail().blacklist(';').escape().withMessage('Invalid Email'),
  body('pincode').trim().isNumeric().withMessage('Invalid Pin Code')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var messages = [];
    for (var i = 0; i < 1; i++) {
      messages.push(errors.array().pop().msg)
    }
    return res.render('user/signup', { data: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
  }
  next();
},
  passport.authenticate('local.signup', {
    failureRedirect: '/user/signup',
    failureFlash: true
  }), function (req, res, next) {

    const token = jwt.sign({
      email:req.body.email,
      id:req.user._id
    },
    process.env.JWT_KEY,
    {
      expiresIn:'1h'
    }
    );
    res.cookie('soijidagh', token, {
      expires: new Date(Date.now() + 60 * 60 * 1000),
      secure: false, // true for https
      httpOnly: true
    });

    if (req.session.oldUrl) {
      var oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    }
    else {
      res.redirect('/user/profile');
    }
  }
);

//Get Login Page
router.get('/login', notLoggedIn, csrfProtection, (req, res, next) => {
  var messages = req.flash('error')
  res.render('user/login', { data: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 })
});

//User login
router.post('/login', [
  body('password').isLength({ min: 8 }).withMessage('Invalid Password'),
  body('email').trim().isEmail().withMessage('Invalid Email')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var messages = [];
    for (var i = 0; i < 1; i++) {
      messages.push(errors.array().pop().msg)
    }
    return res.render('user/login', { data: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
  }
  next();
},
  passport.authenticate('local.login', {
    failureRedirect: '/user/login',
    failureFlash: true
  }), function (req, res, next) { //successRedirect
    const token = jwt.sign({
      email:req.body.email,
      id:req.user._id
    },
    process.env.JWT_KEY,
    {
      expiresIn:'1h'
    }
    );
    res.cookie('soijidagh', token, {
      expires: new Date(Date.now() + 60 * 60 * 1000),
      secure: false, // true for https
      httpOnly: true
    });

    if (req.session.oldUrl) {
      var oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    }
    else {
      res.redirect('/user/profile');
    }
  }
);

//forgot password
router.get('/forgot', (req, res) => {
  var msg = req.flash('info');
  res.render('user/forgot', { data: req.csrfToken(), msg: msg });
});

//Post forgot
router.post('/forgot', function (req, res, next) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/user/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
         user: process.env.gmailID,
      pass: process.env.GmailPassword
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'rgaurav0987@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function (err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) return console.log(err);
    res.redirect('/user/forgot');
  });
});


//reset password
router.get('/reset/:token', function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('info', 'Password reset token is invalid or has expired.');
      return res.redirect('/user/forgot');
    }

    var msg = req.flash('reseterror');
    res.render('user/reset', {
      data: req.csrfToken(),
      user: user,
      msg: msg
    });
  });
});

//reset post
router.post('/reset/:token', function (req, res) {

  if (req.body.resetpassword != req.body.confirmpassword) {
    req.flash('reseterror', 'Password Mismatch');
    return res.redirect(`/user/reset/${req.params.token}`);
  }

  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
    if (!user) {
      req.flash('info', 'Password reset token is invalid or has expired.');
      return res.redirect('/user/forgot');
    }

    user.password = req.body.resetpassword;
    user.password = user.encryptPassword(user.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    user.save(function (err) {
      req.logIn(user, function (err) {
        if(err) {console.log(err);}
      });
    });

  var smtpTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.gmailID,
      pass: process.env.GmailPassword
    }
  });
  var mailOptions = {
    to: user.email,
    from: 'rgaurav0987@gmail.com',
    subject: 'Your password has been changed',
    text: 'Hello,\n\n' +
      'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
  };
  smtpTransport.sendMail(mailOptions, function (err) {
    req.flash('success', 'Success! Your password has been changed.');
    if(err){console.log(err)};
  });
});

  res.redirect('/')
});

//logout
router.get('/logout', (req, res, next) => {
  req.logOut();
  res.redirect('/');
});

module.exports = router;
