var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  let products = [
    {
      name: "Iphone 11",
      category: "Mobile",
      description: "This is Iphone",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    },
    {
      name: "Realme",
      category: "Mobile",
      description: "This is Realme",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    },
    {
      name: "Samsung",
      category: "Mobile",
      description: "This is Samsung",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    },
    {
      name: "Lenovo",
      category: "Mobile",
      description: "This is Lenovo",
      price: "60000",
      image: "https://images-na.ssl-images-amazon.com/images/I/71i2XhHU3pL._SL1500_.jpg"
    }
  ];

  res.render('admin/view-products.hbs', { admin: true, products });
});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true });
});

router.post('/add-product', (req, res) => {
  console.log(req.body);
  console.log(req.files.image);
});

module.exports = router;
