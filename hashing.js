const bcrypt = require('bcrypt');

async function hashEmail(email) {
    try {
        const saltRounds = 10;
        const hashedEmail = await bcrypt.hash(email, saltRounds);
        return hashedEmail;
    } catch (error) {
        console.error('Error hashing email:', error);
    }
}

async function hashPassword(password) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

const email = 'shoppingcart100@gmail.com';
const password = '123456789';

hashEmail(email).then(hashedEmail => {
    console.log('Original Email:', email);
    console.log('Hashed Email:', hashedEmail);
});


hashPassword(password).then(hashedPassword => {
    console.log('Original password:', password);
    console.log('Hashed password:', hashedPassword);
});


