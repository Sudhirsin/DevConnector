const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// to bring the config and the secret token
const config = require('config');

// add validator from express-validator
const { check, validationResult } = require('express-validator');

// bring the user model
const User = require('../../models/Users')

// @route         POST api/users  --> route
// @description   Register users
// @access        Public --> 
router.post('/', [

    // do validation here
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more character').isLength({ min: 6 })

    ],
    async (req, res) => {
    // req.body will when we initailise middleware for the body parser
    // server page(Init Middleware)
    // console.log(req.body); 

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()})
    }
    
    const { name, email, password } = req.body;

    try {
        // see if user is exists
        let user = await User.findOne({ email: email });

        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exits' }] });
        }
    
        // get users gravatar
        const avatar = gravatar.url(email, {
            s: '200',  //size
            r: 'pg',  //rating
            d: 'mm'  //default
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        // encrypt passwaord
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password, salt) 
        
        await user.save();

        // return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            {expiresIn: 360000},    //expires token
            (err, token) => {
                if(err) throw err;
                res.json({ token })
            }); 
        
        // res.send('User registered..')
    } catch(err) {
        console.log(err.message);
        res.status(500).send('Server error')
    }



});


module.exports = router;