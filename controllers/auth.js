const jwt = require("jsonwebtoken"); // this npm module creates the user token that our frontend will use to know if a user is logged in, etc.
require("dotenv").config(); // npm module that allows us to use environment variables in the .env file (have to run config in order to get access to that file)
const expressJwt = require("express-jwt"); // authenticates people to switch routes using a jsonwebtoken
const User = require("../models/user"); // imports the User schema to be used as a model according to mongoose
const _ = require("lodash");
const { sendEmail } = require("../helpers");

exports.signup = async (req, res) => { // creates a new function (?) called getPosts with two variables passed in and using async/await
  const userExists = await User.findOne({email: req.body.email}); // this is waiting until either a user is found or not found using findOne (find the first user and it's done) based on the email field in userSchema (req.body means it will be coming in as a request and it will be in the body)
  if(userExists) return res.status(403).json({ // userExists will be true or false; if true we return the 403 status respose
    error: "Email is taken" // transaled into json (from line above) and sending the error message
  });
  const user = await new User(req.body); // using await because this will take time as well; we create a new User document using the body of that schema (name, email, password)
  await user.save(); // saving this new user to the database which also takes time
  res.status(200).json({ message: "Signup success! Please login." }); // gives a json response message to the new user
};

exports.signin = (req, res) => { // creating a method to generate a user token to authenticate user on frontend
  // find the user based on Email
  const {email, password} = req.body; // we are expecting to get an email and password from the request body of a sign-in
  User.findOne({email}, (err, user) => { // tries to find a user in our database with the email provided in the request body, will either return us a user or an error (hence those two variables are listed)
    // if error or no user
    if(err || !user) {
      return res.status(401).json({ // returns the error code as the status in the json response plus a message on the next line
        error: "User with that email does not exist. Please sign in."
      });
    }
    // if user is found make sure email and password match
    // create authenticate method in model and use here
    if(!user.authenticate(password)) { // this is a question to see if the password given in the request body matches the same password used to create that user's account
      return res.status(401).json({ // returns the error code as the status in the json response plus a message on the next line
        error: "Email and password do not match"
      });
    }
    // generate token with user id and secret
    const token = jwt.sign({_id: user._id, role: user.role}, process.env.JWT_SECRET); // this generates a cookie using the user ID and our secret from the env file
    // persist the token as 't' in cookie with expiry date
    res.cookie("t", token, {expire: new Date() + 9999}); // creates a cookie named "t" given our token and also sets an expiration date for the authentication
    // return json response with user and token to frontend client
    const { _id, name, email, role } = user; // not sure why this line exists
    return res.json({token, user: {_id, email, name, role}}); // gives json response with the new token, and our user details
  });
};

exports.signout = (req, res) => { // this is for signing out
  res.clearCookie("t"); // this method is a response that clears the cookie we had created
  return res.json({message: "Signout success!"}); // don't need a 200 status because that will already be there, just giving a json message that signout was successful
};

exports.requireSignin = expressJwt({ // this is for switching routes and checking to make sure a user is authenticated so they can go to the route
  // if the token is valid, express jwt appends the verified user's id
  // in an auth key to the request object
  secret: process.env.JWT_SECRET, // authentication requires our secret which is stored as an environment variable in our .env folder
  userProperty: "auth" // this seems to be part of express jwt, would have to look at the docs of that module to understand what this line is
});

// add forgotPassword and resetPassword methods
exports.forgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: "No request body" });
    if (!req.body.email)
        return res.status(400).json({ message: "No Email in request body" });

    console.log("forgot password finding user with that email");
    const { email } = req.body;
    console.log("signin req.body", email);
    // find the user based on email
    User.findOne({ email }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "User with that email does not exist!"
            });

// generate a token with user id and secret
    const token = jwt.sign(
        { _id: user._id, iss: "NODEAPI" },
        process.env.JWT_SECRET
    );

    // email data
    const emailData = {
        from: "noreply@node-react.com",
        to: email,
        subject: "Password Reset Instructions",
        text: `Please use the following link to reset your password: ${
            process.env.CLIENT_URL
        }/reset-password/${token}`,
        html: `<p>Please use the following link to reset your password:</p> <p>${
            process.env.CLIENT_URL
        }/reset-password/${token}</p>`
    };

    return user.updateOne({ resetPasswordLink: token }, (err, success) => {
                if (err) {
                    return res.json({ message: err });
                } else {
                    sendEmail(emailData);
                    return res.status(200).json({
                        message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                    });
                }
            });
        });
    };

// to allow user to reset password
// first you will find the user in the database with user's resetPasswordLink
// user model's resetPasswordLink's value must match the token
// if the user's resetPasswordLink(token) matches the incoming req.body.resetPasswordLink(token)
// then we got the right user

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "Invalid Link!"
            });

    const updatedFields = {
               password: newPassword,
               resetPasswordLink: ""
           };

           user = _.extend(user, updatedFields);
           user.updated = Date.now();

           user.save((err, result) => {
               if (err) {
                   return res.status(400).json({
                       error: err
                   });
               }
               res.json({
                   message: `Great! Now you can login with your new password.`
               });
           });
       });
   };

exports.socialLogin = (req, res) => {
   // try signup by finding user with req.email
   let user = User.findOne({ email: req.body.email }, (err, user) => {
       if (err || !user) {
           // create a new user and login
           user = new User(req.body);
           req.profile = user;
           user.save();
           // generate a token with user id and secret
           const token = jwt.sign(
               { _id: user._id, iss: "NODEAPI" },
               process.env.JWT_SECRET
           );
           res.cookie("t", token, { expire: new Date() + 9999 });
           // return response with user and token to frontend client
           const { _id, name, email } = user;
           return res.json({ token, user: { _id, name, email } });
       } else {
           // update existing user with new social info and login
           req.profile = user;
           user = _.extend(user, req.body);
           user.updated = Date.now();
           user.save();
           // generate a token with user id and secret
           const token = jwt.sign(
               { _id: user._id, iss: "NODEAPI" },
               process.env.JWT_SECRET
           );
           res.cookie("t", token, { expire: new Date() + 9999 });
           // return response with user and token to frontend client
           const { _id, name, email } = user;
           return res.json({ token, user: { _id, name, email } });
       }
   });
};
