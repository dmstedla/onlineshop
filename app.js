var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var mongoStore = require('connect-mongo')(session);

var routes = require('./routes/index');
var userRoutes = require('./routes/users');

var app = express();

mongoose.connect('mongodb+srv://labDB:1234@cluster0-ybgdl.mongodb.net/eshopping?retryWrites=true'); // the database will be created automatically if it is not there.
require('./config/passport'); // simply load it and this will run the passport.js file

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
	secret: 'secretiveShoppingCart', 
	resave: false, 
	saveUninitialized: false,
	store:  new mongoStore({ 
		mongooseConnection: mongoose.connection 
	}),
	cookie: { maxAge: 180 * 60 * 1000 } // time to live: 180 minutes / 3 hrs
})); 
app.use(flash());
app.use(passport.initialize());
app.use(passport.session()); // use session to store the user
																	  // resave: true -> this session will be saved on the server 
app.use(express.static(path.join(__dirname, 'public')));			  // on each req no matter there is an update or not
																	   // saveUninitialized: true -> the session will be stored
																	   // even though it might not have been initialized 

app.use(function(req, res, next) {
	res.locals.login = req.isAuthenticated(); // true OR false
	res.locals.session = req.session; // session object
	// because of the above line, session is available in hbs 
	// <span class="badge">{{session.cart.totalQty}}</span>
	next();
});

app.use('/user', userRoutes) // the ordering of these 2 routes is important																 
app.use('/', routes);												  	
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
