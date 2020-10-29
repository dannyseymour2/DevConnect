const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const gravatar = require('gravatar');

const User = require('../../models/User');

// @route  POST api/users
// @desc   Register user
// @access Public
router.post('/',[
    check('name', 'Name is Required').not().isEmpty(),
    check('email','Please include a valid email').isEmail(),
    check('password','Please enter a password with 6 or more characters').isLength({
        min:6
    })
],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    //see if user exists
    const{name, email, password} = req.body;
    
    try{
        let user = await User.findOne({
            email
        }); 
        if (user){
            res.status(400).json({
                errors: errors.array()
            });
        }



    //Encrypt password

    //Return jsonwebtoken

    res.send('User Route');
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}
    );

module.exports = router;