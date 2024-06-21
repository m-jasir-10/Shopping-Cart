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

/* GET users listing. */
router.get('/', function (req, res, next) {
  let user = req.session.user;
  console.log(user);

  productHelpers.getAllProducts()
    .then((products) => {
      res.render('user/view-products.hbs', { products, user });
    })
    .catch((error) => {
      console.error(error);
    });
});

router.get('/signup', redirectHome, (req, res) => {
  res.render('user/signup', { signupErr: req.session.signupErr });
  req.session.signupErr = null;
});

router.get('/login', redirectHome, (req, res) => {
  res.render('user/login', { loginErr: req.session.loginErr });
  req.session.loginErr = null;
});

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    if (response.status) {
      res.redirect('/login');
    } else {
      req.session.signupErr = response.message;
      res.redirect('/signup');
    }
  });
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

module.exports = router;
