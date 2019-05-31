const _ = require('lodash'); // imports npm module called lodash which has helpful methods for updating user profiles (?)
const User = require("../models/user"); // imports the User schema to be used as a model according to mongoose
const formidable = require('formidable'); // npm package for helping to parse file uploads
const fs = require('fs'); // core nodeJS module call file system, will give us access to the file system

exports.userById = (req, res, next, id) => { // fetches the information associated with a user (called when a userId is included in a request)
  User.findById(id) // mongoose method
  // populate followers and following users array
  .populate('following', '_id name')
  .populate('followers', '_id name')
  .exec((err, user) => { // this findById method is part of mongoose, interacts with the mongoose model, will either return us a user or an error and exec is short for execute
    if(err || !user) { // if an error or no user is found
      return res.status(400).json({ // in this case returns a 400 status and a json response
        error: "User not found"
      });
    }
    req.profile = user; // adds a new property in the request object that contains all user information
    next(); // because it's middleware we tell it to keep going either way
  });
};

exports.hasAuthorization = (req, res, next) => { // this method is going to check that the ids for profile and auth match
  const authorized = req.profile && req.auth && req.profile._id === req.auth._id; // makes sure profile and auth are both included in request and checks that they match
  if(!authorized) { // if they don't match
    return res.status(403).json({ // 403 response means unauthorized
      error: "User is not authorized to perform this action"
    });
  }
};

exports.allUsers = (req, res) => { // this method is for listing all the users of our app
  User.find((err, users) => { // will either find users or return an error
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json(users); // this would be ({users: users}) but when key and value are the same, only need to write it once
  }).select("name email updated created"); // find method ends here and we are choosing which user fields to display (don't need to see hashed password, etc.) - can also include "updated" even if a user has never updated and field is not available
};

exports.getUser = (req, res) => { // fetches a single user
  req.profile.hashed_password = undefined; // makes it so that this field doesn't show up when the user profile is pulled
  req.profile.salt = undefined; // makes it so that this field doesn't show up when the user profile is pulled
  return res.json(req.profile); // returns the profile of the userId we requested
};

// exports.updateUser = (req, res, next) => { // this method is for helping a user update their own profile
//   let user = req.profile; // using req.profile here because it means you're already authenticated
//   user = _.extend(user, req.body); // VERY IMPORTANT: that _ is how you call lodash; extend is how you mutate the source object; user is what already exists in the profile and req.body is whatever we are trying to change/update on our profile
//   user.updated = Date.now(); // this is how we create the "updated" field, which will populate with the current date once you update something in your profile
//   user.save((err) => {  // this user.save by itself just saves the updated user profile to the database, also we are checking for errors
//     if(err) {
//       return res.status(400).json({
//         error: "You are not authorized to perform this action"
//       });
//     }
//     user.hashed_password = undefined; // makes it so that this field doesn't show up when the user profile is pulled
//     user.salt = undefined; // makes it so that this field doesn't show up when the user profile is pulled
//     res.json({user}); // returns the user as a json response (remember this field would be ({user: user}) but we don't need to write it twice)
//   });
// };

exports.updateUser = (req, res, next) => { // this method handles the form, makes changes to the user model and then saves
  let form = new formidable.IncomingForm() // handles the incoming form request
  form.keepExtensions = true // because we want to keep the extensions
  form.parse(req, (err, fields, files) => { // fields checks for fields like name, email, files check for files
    if(err) {
      return res.status(400).json({
        error: "Photo could not be uploaded"
      })
    }
    // save user
    let user = req.profile
    user = _.extend(user, fields) // this uses lodash to mutate the current fields
    user.updated = Date.now() // updates the date for when the user last updated their profile

    if(files.photo) { // if there are files attached
      user.photo.data = fs.readFileSync(files.photo.path) // our user model has a photo.data section, fs is reading the file, not sure what else happens here
      user.photo.contentType = files.photo.type // this line and the readFileSync line is about taking the data we get and populating the user model
    }

    user.save((err, result) => { // saving the updated result to the user model
      if (err) {
        return res.status(400).json({ // standard error handling
          error:err
        })
      }
      user.hashed_password = undefined // setting these as undefined right before we send the data to the frontend because we don't want to show these on the frontend
      user.salt = undefined // setting these as undefined right before we send the data to the frontend because we don't want to show these on the frontend
      res.json(user);
    })
  })
}

exports.userPhoto = (req, res, next) => {
  if(req.profile.photo.data) {
    res.set("Content-Type", req.profile.photo.contentType)
    return res.send(req.profile.photo.data);
  }
  next()
}

exports.deleteUser = (req, res, next) => { // this is how you delete a user
  let user = req.profile; // again using req.profile I assume because it has already passed the authentication step earlier
  user.remove((err, user) => { // remove function is how you delete a user, unlikely for there to be errors but we handle anyways
    if(err) {
      return res.status(400).json({
        error: err // just giving the error back instead of a response because it is so unlikely to get errors here
      });
    }
    res.json({message: "User deleted successfully"});
  });
};

// follow (following followers)
exports.addFollowing = (req, res, next) => {
  User.findByIdAndUpdate( // User is the user model, findByIdAndUpdate is a mongoose method (takes three arguments, last is a callback function)
    req.body.userId, // req.body.userId and req.body.followId will come from the front-end
    {$push: {following: req.body.followId}}, // $push is apparently how you update that list in this method
    (err, result) => {
      if(err) {
        return res.status(400).json({error: err}) // standard error handling
      }
      next();
  })
}

exports.addFollower = (req, res) => {
  User.findByIdAndUpdate( // User is the user model, findByIdAndUpdate is a mongoose method (takes three arguments, last is a callback function)
    req.body.followId, // req.body.followId instead of userId because this user is becoming a follower
    {$push: {followers: req.body.userId}}, // We basically switched req.body.followId and req.body.userId in the addFollower method vs. addFollowing method; $push is apparently how you update that list in this method
    {new: true} // need to do this because otherwise MongoDB will return the old data, not the updated data
  )
  .populate('following', "_id name") // populates the following list
  .populate('followers', "_id name") // populates the followers list
  .exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    result.hashed_password = undefined; // don't want to give the user password to the frontend
    result.salt = undefined; // don't want to give the user salt to the frontend
    res.json(result);
  });
};

// unfollowing (THIS IS ALMOST THE EXACT SAME AS FOLLOW ABOVE BUT WITH SOME KEY CHANGES)
exports.removeFollowing = (req, res, next) => {
  User.findByIdAndUpdate( // User is the user model, findByIdAndUpdate is a mongoose method (takes three arguments, last is a callback function)
    req.body.userId, // req.body.userId and req.body.unfollowId will come from the front-end
    {$pull: {following: req.body.unfollowId}}, // changed to $pull from push in the follow section (in order to remove something?)
    (err, result) => {
      if(err) {
        return res.status(400).json({error: err}) // standard error handling
      }
      next();
  })
}

exports.removeFollower = (req, res) => {
  User.findByIdAndUpdate( // User is the user model, findByIdAndUpdate is a mongoose method (takes three arguments, last is a callback function)
    req.body.unfollowId, // req.body.unfollowId instead of userId (switched from removeFollowing function)
    {$pull: {followers: req.body.userId}}, // We basically switched req.body.followId and req.body.userId in the addFollower method vs. addFollowing method; $push is apparently how you update that list in this method
    {new: true} // need to do this because otherwise MongoDB will return the old data, not the updated data
  )
  .populate('following', "_id name") // populates the following list
  .populate('followers', "_id name") // populates the followers list
  .exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    result.hashed_password = undefined; // don't want to give the user password to the frontend
    result.salt = undefined; // don't want to give the user salt to the frontend
    res.json(result);
  });
};

exports.findPeople = (req, res) => {
  let following = req.profile.following; // this grabs everyone the user is already following
  following.push(req.profile._id); // this adds the user to their own following variable (to get the full list of people NOT to suggest they follow)
  User.find({ _id: { $nin: following } }, (err, users) => { // $nin is a way to return a group of people not to include in the list
    if (err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json(users);
  }).select("name"); // we don't want the entire users object, we just want the name
};
