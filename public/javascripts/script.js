function addToCart(productId) {
    $.ajax({
        url: '/add-to-cart/' + productId,
        method: 'get',
        success: (responce) => {
            if(responce.status) {
                let count = $('#cart-count').html();
                count = parseInt(count) + 1;
                $('#cart-count').html(count);
            }
        }
    });
}