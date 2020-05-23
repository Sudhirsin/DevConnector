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
        console.error(err);
        if(err.name === 'CastError') {
            return res.status(404).json({ 'msg': 'Post not found' })
        }
        res.status(500).send('Sever Error')
    }
});


// Delete post
// Delete post by id
// @route         DELETE api/posts/:id
// @description   Delete  post by id
// @access        Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // user dosn't exist
        if(!post) {
            return res.status(404).json({ 'msg': 'Post not found' })
        }

        // check user
        // post.user is object --> convert into strint and match it
        if(post.user.toString() !== req.user.id) {
            // 401 is not authorized
            return res.status(401).json({ msg: 'User not authorized' });

        }

        await post.remove();

        res.json({ msg: 'Post removed' });
    } catch (err) {
        console.error(err.message);
        // console.error(err);

        if(err.name === 'CastError') {
            return res.status(404).json({ 'msg': 'Post not found' })
        } 
        res.status(500).send('Sever Error')
    }
});



// Like post
// Put post by id --> basically put request we are updating the post
// @route         PUT api/posts/like/:id
// @description   Like a post 
// @access        Private
router.put('/like/:id', auth, async (req, res) => {
    try {

        // fetch the post
        const post = await Post.findById(req.params.id);

        // check if the post already been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already Liked' });
        }

        post.likes.unshift({ user: req.user.id })

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// Unlike post
// @route         PUT api/posts/unlike/:id
// @description   Like a post 
// @access        Private
router.put('/unlike/:id', auth, async (req, res) => {
    try {

        // fetch the post
        const post = await Post.findById(req.params.id);

        // check if the post already been liked
        // if length = 0 means we havn't liked it
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' });
        }

        // Get remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1)

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// Comments
// @route         POST api/posts/comment/:id
// @description   Comment on  a post
// @access        Private
router.post(
    "/comment/:id",
    [auth, [check("text", "Text is required").not().isEmpty()]],
    async (req, res) => {
        const errors = validationResult(req);
  
        if(!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
  
        } 
  
        try {
            // select('-password') --> will not give us the password fields
            const user = await User.findById(req.user.id).select('-password');
            
            // get a post
            const post = await Post.findById(req.params.id);

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            }

            post.comments.unshift(newComment);
            
            await post.save();
            res.json(post.comments);
  
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Sever Error')
        }
  
    }
  );


// @route         DELETE api/posts/comment/:id/:comment_id
//                :id --> for post && :comment_id --> comment id
// @description   Delete comment
// @access        Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        // pull out the comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Make sure commnet exits
        if(!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        // make to the who made the comment can delete his comment
        // check user
        if(comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }


        // find the index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json(post.comments);;

 
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

module.exports = router;
