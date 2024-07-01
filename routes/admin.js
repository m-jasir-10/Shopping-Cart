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
router.get('/', verifyLogin, async function (req, res, next) {
    let ordersCount = await productHelpers.getOrdersCount();
    let usersCount = await productHelpers.getUsersCount();
    productHelpers.getAllProducts()
        .then((products) => {
            let admin = req.session.admin;
            res.render('admin/view-products.hbs', { admin, products, usersCount, ordersCount });
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

router.post('/add-product', verifyLogin, (req, res) => {
    let image = req.files.image;
    let imageExtension = path.extname(image.name).substring(1).toLowerCase();

    if (isNaN(req.body.price) || req.body.price <= 0) {
        return res.json({ status: false, message: "Price must be a positive number" });
    }

    productHelpers.addProduct(req.body)
        .then((productId) => {
            let imagePath = '/images/products/' + productId + imageExtension;
            let uploadPath = path.join(__dirname, '../public', imagePath);
            image.mv(uploadPath, (err) => {
                if (!err) {
                    productHelpers.updateProductImage(productId, imagePath)
                        .then(() => {
                            return res.json({ status: true, message: "Product added successfully!" });
                        })
                        .catch((err) => {
                            return res.json({ status: false, message: "Error updating product image" });
                        });
                } else {
                    return res.json({ status: false, message: "Error uploading image" });
                }
            });
        })
        .catch((err) => {
            return res.json({ status: false, message: "Error adding product" });
        });
});

router.post('/delete-product', verifyLogin, (req, res) => {
    productHelpers.deleteProduct(req.body.id).then((response) => {
        res.json({ status: true, message: 'Product deleted successfully' });
    }).catch(() => {
        res.json({ status: false, message: 'Failed to delete the product' });
    });
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

    if (isNaN(productDetails.price) || productDetails.price <= 0) {
        return res.json({ status: false, message: "Price must be a positive number" });
    }

    if (image) {
        let imageExtension = path.extname(image.name).substring(1).toLowerCase();

        let imagePath = '/images/products/' + productId + imageExtension;
        let uploadPath = path.join(__dirname, '../public', imagePath);

        image.mv(uploadPath, async (err) => {
            if (err) {
                return res.json({ status: false, message: "Error uploading image" });
            } else {
                productHelpers.updateProductImage(productId, imagePath)
                    .then(() => {
                        productHelpers.updateProduct(productId, productDetails)
                            .then(() => {
                                return res.json({ status: true, message: "Product edited successfully!" });
                            })
                            .catch(() => {
                                return res.json({ status: false, message: "Error updating product" });
                            });
                    })
                    .catch(() => {
                        return res.json({ status: false, message: "Error updating product image:" });
                    });
            }
        });
    } else {
        productHelpers.updateProduct(productId, productDetails)
            .then(() => {
                return res.json({ status: true, message: "Product edited successfully!" });
            })
            .catch(() => {
                return res.json({ status: false, message: "Error updating product" });
            });
    }
});

router.get('/all-orders', verifyLogin, async (req, res) => {
    let admin = req.session.admin;
    let ordersCount = await productHelpers.getOrdersCount();
    let usersCount = await productHelpers.getUsersCount();
    productHelpers.getAllOrderDetails().then((orders) => {
        res.render('admin/all-orders', { admin, orders, ordersCount, usersCount });
    });
});

router.post('/change-order-status', verifyLogin, (req, res) => {
    productHelpers.changeOrderStatus(req.body.orderId, req.body.orderStatus)
        .then((response) => {
            res.json(response);
        })
});

router.get('/all-users', verifyLogin, async (req, res) => {
    let admin = req.session.admin;
    let usersCount = await productHelpers.getUsersCount();
    let ordersCount = await productHelpers.getOrdersCount();
    productHelpers.getAllUsers().then((users) => {
        res.render('admin/all-users', { admin, users, usersCount, ordersCount })
    });
});

router.get('/view-user-orders/:id', verifyLogin, async (req, res) => {
    let admin = req.session.admin;
    let userId = req.params.id;
    let usersCount = await productHelpers.getUsersCount();
    let ordersCount = await productHelpers.getOrdersCount();
    let userOrders = await productHelpers.getUserOrders(userId);
    let userOrdersCount = await productHelpers.getUserOrdersCount(userId);
    let userInfo = await productHelpers.getUserDetails(userId);
    res.render('admin/user-orders', { admin, userOrders, userInfo, userOrdersCount, ordersCount, usersCount });
});

module.exports = router;