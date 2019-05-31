const express = require("express"); // npm module used for HTTP stuff
const {
  signup,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  socialLogin
 } = require("../controllers/auth"); // allows us to directly use the functions we defined in a different file - the "../ gets out of current folder and gets us into another folder"
const { userById } = require("../controllers/user"); // allows us to directly use the functions we defined in a different file - the "../ gets out of current folder and gets us into another folder"
const { userSignupValidator, passwordResetValidator } = require("../validator"); // somehow we don't need to put the /index part here, it knows to go to index

const router = express.Router(); // .Router is a class used to create route handlers (using express obviously)

router.post("/signup", userSignupValidator, signup); // handles the post request at /signup, runs middleware to validate the signup is legit, then runs signup controller method
router.post("/signin", signin); // handles the post request at /signin, then runs signin controller method
router.get("/signout", signout); // signout; get request because we aren't posting anything
// password forgot and reset routes
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);
// then use this route for social login
router.post("/social-login", socialLogin); 

// any routes containing :userID, our app will first execute userById() method
router.param("userId", userById); // looks for userId as a parameter and then runs the following method


module.exports = router; // exports router to be used elsewhere
