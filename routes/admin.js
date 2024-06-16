const express = require('express');
const productHelpers = require('../helpers/product-helpers');
const router = express.Router();
const path = require('path');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('admin/view-products.hbs', { admin: true, products });

  
});

router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true });
});

router.post('/add-product', (req, res) => {
  let image = req.files.image;

  productHelpers.addProduct(req.body)
    .then((productId) => {
      let imagePath = '/images/products/' + productId + path.extname(image.name);
      let uploadPath = './public' + imagePath;
      image.mv(uploadPath, (err) => {
        if (!err) {
          productHelpers.updateProductImage(productId, imagePath)
            .then(() => {
              res.render('admin/add-product', { admin: true });
            })
            .catch((err) => {
              console.error("Error updating product image:", err);
              res.status(500).send("Error updating product image");
            });
        } else {
          console.error("Error uploading image:", err);
          res.status(500).send("Error uploading image");
        }
      });
    })
    .catch((err) => {
      console.error("Error adding product:", err);
      res.status(500).send("Error adding product");
    });
});


module.exports = router;
