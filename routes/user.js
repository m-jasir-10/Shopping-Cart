const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');

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

    if (user) {
        cartCount = await userHelpers.getCartCount(user._id);
    }

    productHelpers.getAllProducts()
        .then((products) => {
            res.render('user/view-products.hbs', { products, user, cartCount });
        })
        .catch((error) => {
            console.error(error);
        });
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
    req.session.destroy();
    res.redirect('/');
});

router.get('/cart', verifyLogin, async (req, res) => {
    let user = req.session.user;
    let cartCount = null;
    let products = await userHelpers.getCartProduct(user._id);
    let totalPrice = await userHelpers.getTotalAmount(user._id);

    if (user) {
        cartCount = await userHelpers.getCartCount(user._id);
    }

    res.render('user/cart', { user, products, cartCount, totalPrice });
});

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
        res.json({ status: true });
    })
});

router.post('/change-product-quantity', (req, res) => {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
        response.cartCount = await userHelpers.getCartCount(req.body.user);
        response.totalPrice = await userHelpers.getTotalAmount(req.body.user);
        res.json(response);
    });
});

router.post('/remove-product-from-cart', verifyLogin, (req, res) => {
    userHelpers.removeProductFromCart(req.body).then((response) => {
        res.json(response);
    });
});

router.get('/place-order', verifyLogin, async (req, res) => {
    let user = req.session.user;
    let totalPrice = await userHelpers.getTotalAmount(user._id);
    res.render('user/place-order', { user, totalPrice });
});

router.post('/place-order', async (req, res) => {
    let cartProducts = await userHelpers.getCartProductList(req.body.userId);
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body, cartProducts, totalPrice).then((response) => {
        res.json({status: true})
    });
});

module.exports = router;
