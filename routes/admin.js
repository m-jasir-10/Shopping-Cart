const express = require('express');
const productHelpers = require('../helpers/product-helpers');
const router = express.Router();
const path = require('path');

const redirectHome = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        res.redirect('/admin');
    } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
    }
};

const verifyLogin = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

/* GET home page. */
router.get('/', verifyLogin, function (req, res, next) {
    productHelpers.getAllProducts()
        .then((products) => {
            let admin = req.session.admin;
            res.render('admin/view-products.hbs', { admin, products });
        })
        .catch((err) => {
            console.log("Error fetching products:", err);
        });
});

router.get('/login', redirectHome, (req, res) => {
    res.render('admin/admin-login', { admin: true, loginErr: req.session.loginErr });
    req.session.loginErr = null;
});

router.post('/login', (req, res) => {
    productHelpers.doLogin(req.body).then((response) => {
        console.log('response' + response);
        if (response.status) {
            req.session.admin = response.admin;
            req.session.adminLoggedIn = true;
            res.redirect('/admin');
        } else {
            req.session.loginErr = response.message;
            res.redirect('/admin/login');
        }
    });
});

router.get('/logout', (req, res) => {
    req.session.admin = null;
    req.session.adminLoggedIn = false;
    res.redirect('/admin');
});

router.get('/add-product', verifyLogin, (req, res) => {
    let admin = req.session.admin;
    res.render('admin/add-product', { admin });
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
                            let admin = req.session.admin;
                            res.render('admin/add-product', { admin, message: "Product added successfully!" });
                        })
                        .catch((err) => {
                            console.log("Error updating product image:", err);
                        });
                } else {
                    console.log("Error uploading image:", err);
                }
            });
        })
        .catch((err) => {
            console.log("Error adding product:", err);
        });
});

router.get('/delete-product/', verifyLogin, (req, res) => {
    let productId = req.query.id;
    console.log(productId);
    productHelpers.deleteProduct(productId).then((response) => {
        res.redirect('/admin');
    })
});

router.get('/edit-product/:id', verifyLogin, async (req, res) => {
    let admin = req.session.admin;
    let productId = req.params.id;
    let product = await productHelpers.getProductDetails(productId);
    res.render('admin/edit-product', { admin, product });
});

router.post('/edit-product/:id', async (req, res) => {
    let productId = req.params.id;
    let productDetails = req.body;
    let image = req.files ? req.files.image : null;

    if (image) {
        let imagePath = '/images/products/' + productId + path.extname(image.name);
        let uploadPath = './public' + imagePath;
        image.mv(uploadPath, (err) => {
            if (err) {
                console.log("Error uploading image:", err);
            } else {
                productHelpers.updateProductImage(productId, imagePath)
                    .then(() => {
                        productHelpers.updateProduct(productId, productDetails)
                            .then(() => {
                                res.redirect('/admin');
                            })
                            .catch((err) => {
                                console.log("Error updating product:", err);
                            });
                    })
                    .catch((err) => {
                        console.log("Error updating product image:", err);
                    });
            }
        });
    } else {
        productHelpers.updateProduct(productId, productDetails)
            .then(() => {
                res.redirect('/admin');
            })
            .catch((err) => {
                console.log("Error updating product:", err);
            });
    }
});

router.get('/all-orders', verifyLogin, (req, res) => {
    let admin = req.session.admin;
    productHelpers.getAllOrderDetails().then((orders) => {
        res.render('admin/all-orders', { admin, orders });
    });
});

router.post('/change-order-status', (req, res) => {
    productHelpers.changeOrderStatus(req.body.orderId, req.body.status).then((response) => {
        res.json(response);
    })
});

module.exports = router;