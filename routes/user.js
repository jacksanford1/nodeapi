const express = require("express"); // npm module used for HTTP stuff
const {
  userById,
  allUsers,
  getUser,
  updateUser,
  deleteUser,
  userPhoto,
  addFollowing,
  addFollower,
  removeFollowing,
  removeFollower,
  findPeople,
  hasAuthorization
} = require("../controllers/user"); // allows us to directly use the functions we defined in a different file - the "../ gets out of current folder and gets us into another folder"
const { requireSignin } = require("../controllers/auth"); // going to be used as a middleware to authenticate a route

const router = express.Router(); // .Router is a class used to create route handlers (using express obviously)

router.put("/user/follow", requireSignin, addFollowing, addFollower); // for following and followers, following needs to come first because of the way we wrote the functions
router.put("/user/unfollow", requireSignin, removeFollowing, removeFollower); // for unfollowing i.e. removing following and follower, following needs to come first because of the way we wrote the functions

router.get("/users", allUsers); // gives us list of all users; get request because we aren't posting anything
router.get("/user/:userId", requireSignin, getUser); // gives us one user based on the userId we included in request - colon means anything after the / will be captured as userId (kinda cool)
router.put("/user/:userId", requireSignin, hasAuthorization, updateUser); // to update in HTTP you use "put"
router.delete("/user/:userId", requireSignin, hasAuthorization, deleteUser); // to update in HTTP you use "put"
// Photo
router.get("/user/photo/:userId", userPhoto);

// who to follow (finding users excluding yourself and people you already follow)
router.get("/user/findpeople/:userId", requireSignin, findPeople);

// any routes containing :userID, our app will first execute userById() method
router.param("userId", userById); // loosk for userId as a parameter and then runs the following method


module.exports = router; // exports router to be used elsewhere
