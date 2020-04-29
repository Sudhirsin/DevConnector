const express = require("express");
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

// bring the profile and user
const Profile = require("../../models/Profile");
const User = require("../../models/Users");

// for testing only
// @route         GET api/profile  --> route
// @description   Test route  --> this is test route
// @access        Public -->
// router.get('/', (req, res) => res.send('Profile route...'))

// @route to     get our profile
// @get          api/profile/me
// @desc         get current useers profile
// @access      private
router.get("/me", auth, async (req, res) => {
  try {
    // populate with name and avatar ---> populate()
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route to     post our profile
// @get          api/profile/
// @desc         create and post users profile
// @access       private

// here we have to pass to middleware auth and vaidator --> [auth, []]
router.post(
  "/",
  [
    auth,
    [
      // validator for profile
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    // there is error
    if(!errors) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkein
    } = req.body

    // build profile object
    const profileFields = {};
    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    if(skills) {
        // to get array
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    // console.log(profileFields.skills);

    // build social object
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(linkein) profileFields.social.linkein = linkein;
    if(instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if(profile) {
        // update -->if profile find and update it
        // findOneAndUpdate() --> means find the profile and update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields }, // to set the profile
          { new: true }
        );

        return res.json(profile)
      }

      // if profile not fond we create it
      // create profile
      profile = new Profile(profileFields);

      await profile.save()
      res.json(profile);;

    } catch(err) {
      console.error(err.message)
      res.status(500).send('Server Error')
    }
    // res.send('Hello');
  }
);

// @route for all profile
// @get          GET api/profile/
// @desc         get all profiles
// @access       public
router.get('/', async (req, res) => {
  try {
    // add name and avatar to profile --> populate()
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);;
    res.json(profiles)

  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})


// @route for profile with user_id
// @get          GET api/profile/user/:user_id
// @desc         get profile by user_id
// @access       public
router.get('/user/:user_id', async (req, res) => {
  try {
    // id is coming is url -> to access req.params.user_id
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ 'msg': 'Profile not found ' })
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    console.log(err)
    if(err.kind == 'ObjectId') {
      console.log('Kind')
      return res.status(400).json({ 'msg': 'Profile not found ' })
    }
    res.status(500).send('Server Error')
  }
})


// @route for profile delete
// @get          DELETE api/profile/
// @desc         Delete profile, user, post
// @access       Private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo -- remove users posts

    // Remove Profile
    // findOneAndremove() --> find it delete
    await Profile.findOneAndRemove({ user: req.user.id })
    
    // reomve user
    await User.findOneAndRemove({ _id: req.user.id })

    res.json({ 'msg': 'User Delete' });

  } catch (err) {
    
  }
})



// @route for profile update
// @get          PUT api/profile/experience
// @desc         Add profile exprience
// @access       Private

// have to provide mutiple middleware [ auth, validation]
router.put('/experience', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From Date is required').not().isEmpty(),
]], async (req, res) => {
   const errors = validationResult(req);

   if(!errors) {
     return res.status(400).json({errors: errors.array() });

   }

    const {
      title,
      company,
      location,
      from, 
      to,
      current,
      description
    } = req.body

    const newExp = {
      title,
      company,
      location,
      from, 
      to,
      current,
      description
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
      
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Sever Error');
    }
})


// route for delete the profile experience
// @get          DELETE api/profile/experience/:exp_id
// @desc         Delete profile exprience
// @access       Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }); 

    // get the correct epxreience and remove index(exp remove)
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

// EDUCATION
// @route for profile update education
// @get          PUT api/profile/education
// @desc         Add profile education
// @access       Private

// have to provide mutiple middleware [ auth, validation]
router.put('/education', [auth, [
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldofstudy', 'Field of study is required').not().isEmpty(),
  check('from', 'From Date is required').not().isEmpty(),
]], async (req, res) => {
   const errors = validationResult(req);

   if(!errors) {
     return res.status(400).json({errors: errors.array() });

   }

    const {
      school,
      degree,
      fieldofstudy,
      from, 
      to,
      current,
      description
    } = req.body

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from, 
      to,
      current,
      description
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
      
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Sever Error');
    }
})


// route for delete the profile education
// @get          DELETE api/profile/education/:edu_id
// @desc         Delete profile education
// @access       Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }); 

    // get the correct epxreience and remove index(exp remove)
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})

// GITHUB Username
// route for delete the profile education
// @get          GET api/profile/github/:username
// @desc         Get user repos from GitHub 
// @access       Public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: {'user-agent': 'node-js'}
    };

    request(options, (error, response, body) => {
      if(error) console.error(error);

      if(response.statusCode !== 200) {
        return res.status(404).json({ 'msg': 'Np GitHub profile found' });
      }

      res.json(JSON.parse(body))
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
})





module.exports = router;
