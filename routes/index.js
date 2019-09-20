var express = require('express');
var router = express.Router();

var Product = require('../models/product');
var Cart = require('../models/cart');
var Order = require('../models/order');


/* GET home page. This routing to home page or product page*/
router.get('/', function(req, res, next) {
	var successMsg = req.flash('success')[0];
	Product.find(function(err, docs) {
		let productChunks = [];
		let chunkSize = 4; // to define the size of product in one row
		for (var i = 0; i < docs.length; i += chunkSize) {//chunkSize= 4
			productChunks.push(docs.slice(i, i + chunkSize));
		}
		
		res.render('shop/index', { title: 'Shopping Cart', products: productChunks, successMsg: successMsg, noMessage: !successMsg});
	});
	
});

// The shopping cart page we routing shopping cart
router.get('/add-to-cart/:id', function(req, res, next) {
	let productId = req.params.id;
	let cart = new Cart(req.session.cart ? req.session.cart : {});
	//let cart = new Cart(req.session.cart ? req.session.cart : {items: {}, totalQty: 0, totalPrice: 0});
	Product.findById(productId, function(err, product) {
		if (err) {
			return res.redirect('/');
		}
		cart.add(product, product.id);
		req.session.cart = cart; // the express will be saved when the response is sent back
		console.log(req.session.cart);
		res.redirect('/');
	})
});
// The shopping cart  adding quantity
router.get('/add/:id', function(req, res, next) {
	let productId = req.params.id;
	let cart = new Cart(req.session.cart ? req.session.cart : {});

	cart.addByOne(productId);
	req.session.cart = cart;
	res.redirect('/shopping-cart');
});
// The shopping cart  reduce quantity
router.get('/reduce/:id', function(req, res, next) {
	let productId = req.params.id;
	let cart = new Cart(req.session.cart ? req.session.cart : {});

	cart.reduceByOne(productId);
	req.session.cart = cart;
	res.redirect('/shopping-cart');
});
// The shopping cart  remove quantity
router.get('/remove/:id', function(req, res, next) {
	let productId = req.params.id;
	let cart = new Cart(req.session.cart ? req.session.cart : {});

	cart.removeItem(productId);
	req.session.cart = cart;
	res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function(req, res, next) {
	if (!req.session.cart) {
		return res.render('shop/shopping-cart', {products: null});
	}
	let cart = new Cart(req.session.cart);
	res.render('shop/shopping-cart', {
		products: cart.generateArray(),
		imagePath: cart.imagePath, totalPrice: cart.totalPrice
	});
});

// get the checkout view
router.get('/checkout', isLoggedIn, function(req, res, next) {
	if (!req.session.cart) {
		return res.redirect('/shopping-cart');
	}
	var cart = new Cart(req.session.cart);
	// connect-flash store multiple objects in the error object array
	// since we store only one, accessing it via [0]
	var errMsg = req.flash('error')[0]; 
	// pass the errMsg and noError to the view
    res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
	//res.render('shop/checkout', {total: cart.totalPrice});
});
// The checkout page routing
router.post('/checkout', isLoggedIn, function(req, res, next) {
	if (!req.session.cart) {
		return res.redirect('/shopping-cart');
	}
	var cart = new Cart(req.session.cart);

	var stripe = require("stripe")(
	  	"sk_test_vartcdLcZpGnPx8lAAbf5kWg"
	);

	stripe.charges.create({
		  amount: cart.totalPrice * 100, // in the smallest unit
		  currency: "Sek",
		  // stripeToken is the name of the hidden input name in the form
		  source: req.body.stripeToken, // obtained with Stripe.js
		  description: "Test Charge"
	}, function(err, charge) {
		// asynchronously called
		if (err) {
			req.flash('error', err.message); // linked to the errMsg in router.get('/checkout')
			return res.redirect('/checkout');
		}
		var order = new Order({
			user: req.user, // passport stores the user object in the req
			cart: cart,
			address: req.body.address, // req.body is where the express store the values sent with a post req 
			name: req.body.name,
			paymentId: charge.id
		});
		order.save(function(err, result) {
			if (err) {
				// need to handle the errors here
			}
			req.flash('success', 'Successfully bought product!');
			req.session.cart = null;
			res.redirect('/');
		});
	});
})

module.exports = router;

 // this middleware can be used for all the routes that we want to protect
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) { // is a method added by passport
		return next();
	}
	req.session.oldUrl = req.url; // to keep the original routing line
	res.redirect('/user/signin');
}
