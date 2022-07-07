function isLoggedIn(req, res, next) {
    // if user is authenticated in the session
    if (req.isAuthenticated()){
        next();
    }
    // if they are not redirect them to the login page
    else {
        res.redirect('/');
    }
};

function notLoggedIn(req, res, next) {
    // if user is authenticated in the session
    if (!req.isAuthenticated()){
        next();
    }
    // if they are not redirect them to the login page
    else {
        res.redirect('/');
    }
};

function isSignedIn(req, res, next) {
    // if user is authenticated in the session
    if (req.isAuthenticated()){
        next();
    }
    // if they are not redirect them to the login page
    else {
        req.session.oldUrl = req.url;
        res.redirect('user/login');
    }
};

module.exports = { isLoggedIn,notLoggedIn,isSignedIn };