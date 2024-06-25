$('#checkout-form').submit((event) => {
    event.preventDefault();

    const address = document.getElementById('inputAddress');
    const city = document.getElementById('inputCity');
    const state = document.getElementById('inputState');
    const pincode = document.getElementById('inputPincode');
    const mobile = document.getElementById('inputMobile');
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    let isValid = true;

    if (address.value === '') {
        address.classList.add('is-invalid');
        isValid = false;
    } else {
        address.classList.remove('is-invalid');
    }

    if (city.value === '') {
        city.classList.add('is-invalid');
        isValid = false;
    } else {
        city.classList.remove('is-invalid');
    }

    if (state.value === '') {
        state.classList.add('is-invalid');
        isValid = false;
    } else {
        state.classList.remove('is-invalid');
    }

    if (pincode.value === '' || pincode.value.length !== 6) {
        pincode.classList.add('is-invalid');
        isValid = false;
    } else {
        pincode.classList.remove('is-invalid');
    }

    if (mobile.value === '' || mobile.value.length !== 10) {
        mobile.classList.add('is-invalid');
        isValid = false;
    } else {
        mobile.classList.remove('is-invalid');
    }

    if (!paymentMethod) {
        document.getElementById('codRadioBtn').classList.add('is-invalid');
        document.getElementById('onlineRadioBtn').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('codRadioBtn').classList.remove('is-invalid');
        document.getElementById('onlineRadioBtn').classList.remove('is-invalid');
    }

    if (isValid) {
        $.ajax({
            url: '/place-order',
            method: 'post',
            data: $('#checkout-form').serialize(),
            success: ((response) => {
                window.location = '/order-success'
            })
        })
    }
})