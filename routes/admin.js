const express = require('express');
const productHelpers = require('../helpers/product-helpers');
const router = express.Router();
const path = require('path');

/* GET home page. */
router.get('/', function (req, res, next) {
  productHelpers.getAllProducts()
    .then((products) => {
      res.render('admin/view-products.hbs', { admin: true, products });
    })
    .catch((err) => {
      console.error("Error fetching products:", err);
      res.status(500).send("Error fetching products");
    });
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
              res.render('admin/add-product', { admin: true, message: "Product added successfully!" });
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

router.get('/delete-product/', (req, res) => {
  let productId = req.query.id;
  console.log(productId);
  productHelpers.deleteProduct(productId).then((response) => {
    console.log(response);
    res.redirect('/admin');
  })
});

router.get('/edit-product/:id', async (req, res) => {
  let productId = req.params.id;
  let product = await productHelpers.getProductDetails(productId);
  res.render('admin/edit-product', { admin: true, product });
});

router.post('/edit-product/:id', async (req, res) => {
  let productId = req.params.id;
  let productDetails = req.body;
  let image = req.files.image;

  if (image) {
    let imagePath = '/images/products/' + productId + path.extname(image.name);
    let uploadPath = './public' + imagePath;
    image.mv(uploadPath, (err) => {
      if (err) {
        console.error("Error uploading image:", err);
        res.status(500).send("Error uploading image");
      } else {
        productHelpers.updateProductImage(productId, imagePath)
          .then(() => {
            productHelpers.updateProduct(productId, productDetails)
              .then(() => {
                res.redirect('/admin');
              })
              .catch((err) => {
                console.error("Error updating product:", err);
                res.status(500).send("Error updating product");
              });
          })
          .catch((err) => {
            console.error("Error updating product image:", err);
            res.status(500).send("Error updating product image");
          });
      }
    });
  } else {
    productHelpers.updateProduct(productId, productDetails)
      .then(() => {
        res.redirect('/admin');
      })
      .catch((err) => {
        console.error("Error updating product:", err);
        res.status(500).send("Error updating product");
      });
  }
});

module.exports = router;
