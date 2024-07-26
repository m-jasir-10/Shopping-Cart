const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const collections = require('../config/collections');
const { ObjectId } = require('mongodb');
const db = require('../config/connection');

const redirectHome = (req, res, next) => {
    if (req.session.userLoggedIn) {
        res.redirect('/');
    } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
    }
};

const verifyLogin = (req, res, next) => {
    if (req.session.userLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

/* GET users listing. */
router.get('/', async (req, res, next) => {
    let user = req.session.user;
    let cartCount = null;
    let ordersCount = null;
    
    if (user) {
        let ordersCount = await userHelpers.getOrdersCount(user._id);
    }

    if (user) {
        cartCount = await userHelpers.getCartCount(user._id);
    }
    productHelpers.getAllProducts()
        .then((products) => {
            res.render('user/view-products.hbs', { products, user, cartCount, ordersCount });
        })
});

router.get('/signup', redirectHome, (req, res) => {
    res.render('user/signup', { signupErr: req.session.signupErr });
    req.session.signupErr = null;
});

router.post('/signup', (req, res) => {
    userHelpers.doSignup(req.body).then((response) => {
        if (response.status) {
            req.session.user = response.user;
            req.session.userLoggedIn = false;
            res.redirect('/login');
        } else {
            req.session.signupErr = response.message;
            res.redirect('/signup');
        }
    });
});

router.get('/login', redirectHome, (req, res) => {
    res.render('user/login', { loginErr: req.session.loginErr });
    req.session.loginErr = null;
});

router.post('/login', (req, res) => {
    userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {
            req.session.user = response.user;
            req.session.userLoggedIn = true;
            res.redirect('/');
        } else {
            req.session.loginErr = response.message;
            res.redirect('/login');
        }
    });
});

router.get('/logout', (req, res) => {
    req.session.user = null;
    req.session.userLoggedIn = false;
    res.redirect('/');
});

router.get('/cart', verifyLogin, async (req, res) => {
    let user = req.session.user;
    let products = await userHelpers.getCartProduct(user._id);
    let totalPrice = await userHelpers.getTotalAmount(user._id);
    let ordersCount = await userHelpers.getOrdersCount(user._id);
    let cartCount = await userHelpers.getCartCount(user._id);
    res.render('user/cart', { user, products, cartCount, totalPrice, ordersCount });
});

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true });
    })
});

router.post('/change-product-quantity', verifyLogin, (req, res) => {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
        response.cartCount = await userHelpers.getCartCount(req.body.user);
        response.totalPrice = await userHelpers.getTotalAmount(req.body.user);
        res.json(response);
    });
});

router.post('/remove-product-from-cart', verifyLogin, (req, res) => {
    let userId = req.body.user;
    let productId = req.body.product;
    let cartId = req.body.cart;
    db.get().collection(collections.CART_COLLECTION)
        .updateOne({ _id: new ObjectId(cartId) },
            {
                $pull: { products: { item: new ObjectId(productId) } }
            }
        )
        .then(async (response) => {
            let cartCount = await userHelpers.getCartCount(userId);
            let totalPrice = await userHelpers.getTotalAmount(userId);
            res.json({ removeProduct: true, cartCount, totalPrice });
        });
});

router.get('/place-order', verifyLogin, async (req, res) => {
    let user = req.session.user;
    let cartCount = await userHelpers.getCartCount(user._id);
    let ordersCount = await userHelpers.getOrdersCount(user._id);
    let totalPrice = await userHelpers.getTotalAmount(user._id);
    res.render('user/place-order', { user, totalPrice, cartCount, ordersCount });
});

router.post('/place-order', async (req, res) => {
    if (req.body.pincode.length !== 6) {
        return res.json({ status: false, message: "Pincode must contain 6 digits" });
    }

    if (req.body.mobile.length !== 10) {
        return res.json({ status: false, message: "Mobile number must contain 10 digits" });
    }

    let cartProducts = await userHelpers.getCartProductList(req.body.userId);
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)

    if (cartProducts.length === 0) {
        return res.json({ status: false, message: "Your cart is empty. Add products to cart before placing an order." });
    }

    userHelpers.placeOrder(req.body, cartProducts, totalPrice).then((response) => {
        return res.json({ status: true, message: 'Your order has been placed successfully' })
    });
});

router.get('/order-success', verifyLogin, async (req, res) => {
    let user = req.session.user;
    let cartCount = await userHelpers.getCartCount(user._id);
    let ordersCount = await userHelpers.getOrdersCount(user._id);
    res.render('user/order-success', { user, cartCount, ordersCount });
});

router.get('/view-orders', verifyLogin, async (req, res) => {
    let user = req.session.user;
    let cartCount = await userHelpers.getCartCount(user._id);
    let orders = await userHelpers.getUserOrderDetails(user._id);
    let ordersCount = await userHelpers.getOrdersCount(user._id);
    res.render('user/view-orders', { user, orders, cartCount, ordersCount });
});

router.get('/profile', verifyLogin, async (req, res) => {
    let user = req.session.user;
    let cartCount = await userHelpers.getCartCount(user._id);
    let ordersCount = await userHelpers.getOrdersCount(user._id);
    res.render('user/profile', { user, cartCount, ordersCount });
});

router.post('/update-profile', verifyLogin, async (req, res) => {
    let response = await userHelpers.updateProfile(req.body);
    if (response.status) {
        req.session.user.name = req.body.name;
        req.session.user.email = req.body.email;
        res.render('user/profile', { user: req.session.user, message: response.message });
    } else {
        res.render('user/profile', { user: req.session.user, error: response.message });
    }
});

module.exports = router;