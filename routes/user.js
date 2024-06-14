var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  let products = [
    {
      name: "I phone 11",
      catogory: "Mobile",
      description: "This is I phone",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    },
    {
      name: "Realme",
      catogory: "Mobile",
      description: "This is Realme",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    },
    {
      name: "Samsung",
      catogory: "Mobile",
      description: "This is Samsung",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    },
    {
      name: "Lonevo",
      catogory: "Mobile",
      description: "This is Lonevo",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    }
  ];
  res.render('user/view-products.hbs', {products})
});

module.exports = router;
