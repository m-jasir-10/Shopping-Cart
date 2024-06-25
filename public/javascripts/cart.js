function addToCart(proId, userId) {
    if (userId) {
        $.ajax({
            url: '/add-to-cart/' + proId,
            method: 'get',
            success: (response) => {
                if (response.status) {
                    let count = $('#cart-count').html();
                    count = parseInt(count) + 1;
                    $('#cart-count').html(count);
                }
            }
        });
    } 
    else {
        window.location.href = '/login';
    }
}

function changeQuantity(cartId, productId, userId, count) {
    let quantity = parseInt(document.getElementById(productId).innerHTML);
    count = parseInt(count);
    $.ajax({
        url: '/change-product-quantity/',
        data: {
            cart: cartId,
            user: userId,
            product: productId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                alert("Product removed from cart");
                location.reload();
            } else {
                document.getElementById(productId).innerHTML = quantity + count;
                document.getElementById('total-price').innerHTML = response.totalPrice;
                document.getElementById('cart-count').innerHTML = response.cartCount;
            }
        }
    });
}

function removeProductFromCart(cartId, productId) {
    $.ajax({
        url: '/remove-product-from-cart',
        method: 'post',
        data: {
            cart: cartId,
            product: productId
        },
        success: (response) => {
            if (response.removeProduct) {
                alert("Product removed from cart");
                location.reload();
            }
        }
    });
}