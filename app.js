const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const indexRouter = require('./routes/index');
const UserRoutes = require('./routes/user');
const MongoStore = require('connect-mongo')(session);
const dotenv = require('dotenv');
dotenv.config({
  path: '../E-commerce-website/.env'
})

mongoose.connect(process.env.MONGO_URL, 
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
require('./config/passport');
var app = express();

app.use(require('express-session')
  ({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
      secure: false,
      httpOnly: true,
      expires: expiryDate
    }
  }));
app.use(cookieParser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated();
  res.locals.session = req.session;
  next();
});

app.use('/user', UserRoutes);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
