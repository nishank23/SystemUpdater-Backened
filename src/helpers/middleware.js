module.exports = function(req, res, next) {
    // Replace 'example.com' with your actual live server's domain
    const baseUrl = 'http://localhost:3000/';
    res.locals.baseUrl = baseUrl;
    next();
};
