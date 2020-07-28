const { nextTick } = require("async");

const jwt = require('jsonwebtoken');

module.exports = (req,res,next)=>{
    try{
        const token = req.cookies.soijidagh;
        const decoded = jwt.verify(token,process.env.JWT_KEY);
        req.userData = decoded;
        next();
    }
    catch(error){
    console.log(error);
    }
}