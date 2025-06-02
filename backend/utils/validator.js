function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 6;
}

function validateRequiredFields(fields) {
    return Object.values(fields).every(value => value && value.toString().trim() !== '');
}

module.exports = {
    validateEmail,
    validatePassword,
    validateRequiredFields
};
