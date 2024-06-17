const express = require('express');
const router = express.Router();
const productHelpers = require('../helpers/product-helpers');

/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts()
    .then((products) => {
      res.render('user/view-products.hbs', { products })
    })
    .catch((error) => {
      console.error(error);
    });
});

module.exports = router;
