$(document).ready(function () {
    $('#products-table').DataTable();
});

function changeStatusOption(orderId) {
    let orderStatus = document.getElementById(orderId).value;
    $.ajax({
        url: '/admin/change-order-status',
        method: 'post',
        data: {
            orderId: orderId,
            status: orderStatus
        },
        success: (response) => {
            if (response.status) {
                alert(response.message);
                location.reload();
            } else {
                alert(response.message);
            }
        }
    });
}

function togglePassword() {
    var passwordInput = document.getElementById('inputPassword');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
}

function viewImage(event) {
    document.getElementById('imageView').src = URL.createObjectURL(event.target.files[0]);
}