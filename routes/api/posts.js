const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');

// testing
// @route         GET api/posts  --> route
// @description   Test route  --> this is test route
// @access        Public -->
// router.get('/', (req, res) => res.send('Posts route...'))

// @route         POST api/posts
// @description   Create a post
// @access        Private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
      const errors = validationResult(req);

      if(!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });

      } 

      try {
          // select('-password') --> will not give us the password fields
          const user = await User.findById(req.user.id).select('-password');
    
          const newPost = new Post ({
              text: req.body.text,
              name: user.name,
              avatar: user.avatar,
              user: req.user.id
          })
          
          const post = await newPost.save();
          res.json(post);

      } catch (err) {
          console.error(err.message);
          res.status(500).send('Sever Error')
      }

  }
);

// Get all posts
// @route         GET api/posts
// @description   Get all posts
// @access        Private
router.get('/', auth, async (req, res) => {
    try {
        // sort and get most recent one {date: -1}
        const post = await Post.find().sort({ date: -1 });
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sever Error')
    }
});


// Get post by id
// @route         GET api/posts/:id
// @description   Get  post by id
// @access        Private
router.get('/:id', auth, async (req, res) => {
    try {
        // sort and get most recent one {date: -1}
        const post = await Post.findById(req.params.id);
        if(!post) {
            return res.status(404).json({ 'msg': 'Post not found' })
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') {
            return res.status(404).json({ 'msg': 'Post not found' })
        }
        res.status(500).send('Sever Error')
    }
});

module.exports = router;
