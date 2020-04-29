const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');



// bring the user from model folder
const User = require('../../models/Users')

// @route         GET api/auth  --> route
// @description   Test route  --> this is test route
// @access        Public --> 

// 1st tym
// router.get('/', (req, res) => res.send('Auth route...'))

// auth parameter is from middleware
router.get('/', auth, async (req, res) => {
    try {
        // select('-password') -->  that will off the password in the data
        const user = await User.findById(req.user.id).select('-password')
        res.json(user);
    } catch(err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});



// login routes
// @route         POST api/auth  --> route
// @description   Authenticate user and get token
// @access        Public --> 
router.post('/', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()

    ],
    async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()})
    }
    
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email: email });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invaid credentials' }] });
        }
    
        // compare password here
        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res
                .status(400)
                .json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

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
        
    } catch(err) {
        console.log(err.message);
        res.status(500).send('Server error')
    }



});



module.exports = router;