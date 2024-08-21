var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var Cart = require('../models/cart');
const stripe = require('stripe')(process.env.SK_KEY);
var Order = require('../models/order');
const { isSignedIn } = require('../config/auth');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const checkAuth = require('../config/check-auth');

/* GET home page. */
router.get('/', function (req, res, next) {
  var popup = req.flash('success');
  Product.find((err, docs) => {
    var productchunks = [];
    var chunksize = 4;
    for (var i = 0; i < docs.length; i += chunksize) {
      productchunks.push(docs.slice(i, i + chunksize));
    }
    res.render('index', { title: 'QuickMart', products: productchunks, popup: popup });
  });
});

router.post('/search', (req, res, next) => {
  var popup = req.flash('success');
  Product.find({ $or: [{ 'category': req.body.search }, { 'brand': req.body.search }, { 'title': req.body.search }] }, (err, products) => {
    var productchunks = [];
    var chunksize = 3;
    for (var i = 0; i < products.length; i += chunksize) {
      productchunks.push(products.slice(i, i + chunksize));
    }
    res.render('index', { title: 'QuickMart', products: productchunks, popup: popup });
  });
});

//add to cart
router.get('/add-to-cart/:id', (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {} });

  Product.findById(productId, function (err, product) {
    if (err)
      return res.redirect('/');

    cart.add(product, product.id);
    req.session.cart = cart;
    res.redirect('/');
  });
});

//shopping cart
router.get('/shopping-cart', (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shopping-cart', { hasProducts: null })
  }
  var cart = new Cart(req.session.cart);
  var cartArray = cart.generateArray();
  res.render('shopping-cart', { products: cartArray, totalPrice: cart.totalPrice, hasProducts: cartArray.length > 0 })
});

//checkout page
router.get('/checkoutcard', isSignedIn,checkAuth, (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shopping-cart', { products: null })
  }
  var cart = new Cart(req.session.cart);
  var messages = req.flash('error')
  res.render('checkout', { total: cart.totalPrice,user:req.user, messages: messages, hasErrors: messages.length > 0 });
});

//get cash on deliver
router.get('/cashondelivery', isSignedIn,checkAuth, (req, res, next) => {
  if (!req.session.cart) {
    return res.render('shopping-cart', { products: null })
  }
  var cart = new Cart(req.session.cart);
  var messages = req.flash('error')
  res.render('cod', {total: cart.totalPrice,user:req.user, messages: messages, hasErrors: messages.length > 0 });
});


//post cash on delivery
router.post('/cash-on-delivery', isSignedIn,checkAuth, [
  body('name').trim().isLength({min:7}).escape().blacklist(";","/","`","'","*").withMessage('Invalid Username'),
  body('address').trim().isLength({min:15}).escape().blacklist(";","/","`","'","*").withMessage('Invalid Address'),
  body('phone').trim().isLength({max:12}).isNumeric().escape().blacklist(";","/","`","'","*").withMessage('Invalid Phone Number')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    var messages = [];
    for (var i = 0; i < 1; i++) {
      messages.push(errors.array().pop().msg)
    }
    return res.render('user/profile', { data: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
  }
  var cart = new Cart(req.session.cart);
  var order = new Order({
    user: req.user,
    cart: cart,
    address: req.body.address,
    name: req.body.name,
    date:Date.now(),
    paymentId: 'Cash On Delivery'
  })
  order.save((err, result) => {
    if (err) { console.log(err) }
    var items = '';
          cart.generateArray().forEach(element => {
            items += element.item.title + ',';
          });

          var Transport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: process.env.gmailID,
              pass: process.env.GmailPassword
            }
          });
          var mailOptions = {
            to: req.user.email,
            from: 'rgaurav0987@gmail.com',
            subject: 'Your password has been changed',
            text: 'hi' +req.user.name+',\n\n' +
              'Thank you for ordering via VipMall,'+
              'Your order for' + items + 'has been Placed\n'+
              'We Will email you with datails of order and tracking info'
          };
          Transport.sendMail(mailOptions, function (err) {
            req.flash('success',  'Your order has been Successfully Placed');
            if (err) { console.log(err) };
          });
    req.session.cart = null;
    req.flash('profilemessage', 'Your order has been Successful')
    res.redirect('user/profile');
  });
});

//post checkout
router.post('/checkoutcard', isSignedIn,checkAuth, [
  body('name').trim().isLength({min:7}).escape().blacklist(";","/","`","'","*").withMessage('Invalid Username'),
  body('address').trim().isLength({min:15}).escape().blacklist(";","/","`","'","*").withMessage('Invalid Address'),
  body('phone').trim().isLength({max:12}).isNumeric().escape().blacklist(";","/","`","'","*").withMessage('Invalid Phone Number')
],(req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      var messages = [];
      for (var i = 0; i < 1; i++) {
        messages.push(errors.array().pop().msg)
      }
      return res.render('user/profile', { data: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
    }
    var cart = new Cart(req.session.cart);
    stripe.customers
      .create({
        name: req.body.name,
        phone:req.body.phone,
        source: req.body.stripeToken
      })
      .then(customer =>
        stripe.charges.create({
          amount: cart.totalPrice * 100,
          currency: "INR",
          description: 'Online Shopping',
          customer: customer.id
        })
      )
      .then((charge) => {
        var order = new Order({
          user: req.user,
          cart: cart,
          address: req.body.address,
          name: req.body.name,
          phone:req.body.phone,
          date:Date.now(),
          paymentId: charge.id
        })
        order.save((err, result) => {
          if (err) { return console.log(err) }
          var cart = new Cart(req.session.cart);
          var items = '';
          cart.generateArray().forEach(element => {
            items += element.item.title + ',';
          });

          var Transport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: process.env.gmailID,
              pass: process.env.GmailPassword
            }
          });
          var mailOptions = {
            to: req.user.email,
            from: 'rgaurav0987@gmail.com',
            subject: 'Your password has been changed',
            text: 'hi' +req.user.name+',\n\n' +
              'Thank you for ordering via VipMall,'+
              'Your order for' + items + 'has been Placed\n'+
              'We Will email you with datails of order and tracking info'
          };
          Transport.sendMail(mailOptions, function (err) {
            req.flash('success',  'Your order has been Successfully Placed');
            if (err) { console.log(err) };
          });

          req.session.cart = null;
          req.flash('profilemessage', 'Your order has been Successful')
          res.redirect('user/profile');
        })
      })
      .catch(err => {
        req.flash('error', 'Invalid Input');
        console.log(err);
        return res.redirect('/checkout');
      });
  } catch (err) {
    req.flash('error', 'Invalid Input');
    console.log(err);
    return res.redirect('/checkout');
  }
});

router.get('/removeitem/:id', (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {} });
  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
})

router.get('/removeall/:id', (req, res, next) => {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : { items: {} });
  cart.removeAll(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
})

module.exports = router;
