const express = require("express"); // npm module used for HTTP stuff
const {
  getPosts,
  createPost,
  postsByUser,
  postById,
  isPoster,
  updatePost,
  deletePost,
  photo,
  singlePost,
  like,
  unlike,
  comment,
  uncomment
} = require("../controllers/post"); // allows us to directly use the functions we defined in a different file - the "../ gets out of current folder and gets us into another folder"
const { requireSignin } = require("../controllers/auth"); // going to be used as a middleware to authenticate a route
const { userById } = require("../controllers/user"); // allows us to directly use the functions we defined in a different file - the "../ gets out of current folder and gets us into another folder"
const { createPostValidator } = require("../validator"); // somehow we don't need to put the /index part here, it knows to go to index

const router = express.Router(); // .Router is a class used to create route handlers (using express obviously)

router.get("/posts", getPosts); // defines the home page route and uses getPosts and a "get" request; requiresSignin makes this a restricted route that requires the secret; this helps: https://expressjs.com/en/guide/routing.html

// like unlike
router.put("/post/like", requireSignin, like) ;// these routes are "clean" and don't have following parameters so we are putting them above the others
router.put("/post/unlike", requireSignin, unlike); // these routes are "clean" and don't have following parameters so we are putting them above the others

// comments
router.put("/post/comment", requireSignin, comment); // these routes are "clean" and don't have following parameters so we are putting them above the others
router.put("/post/uncomment", requireSignin, uncomment); // these routes are "clean" and don't have following parameters so we are putting them above the others

router.post(
  "/post/new/:userId", // this allows us to use the userById function (per the param below) which will give us the req.profile we need
  requireSignin, // requires that the user be signed in
  createPost, // creates the post (requires req.profile in order to do this though)
  createPostValidator // validates the post, this comes last now because createPost uses formdata and this function doesn't understand form data, so it runs after so it gets something it understands
);
router.get("/posts/by/:userId", requireSignin, postsByUser); // need to have the :userId because that gives us access to req.profile thanks to the param function below and userById; don't need to require a signed in user (but we are doing that); this fetches all the posts by a specific user
router.get("/post/:postId", singlePost)
router.put("/post/:postId", requireSignin, isPoster, updatePost); // uses put HTTP to update a currently existing post, after requiring a signin and confirming that the poster is the one trying to make the change
router.delete("/post/:postId", requireSignin, isPoster, deletePost); // need to have the :userId because that gives us access to req.profile thanks to the param function below and userById; need to have a signed in user otherwise anyone could delete the post; isPoster method verifies the current user is the poster of that post; think deletePost just deletes the post
// Photo
router.get("/post/photo/:postId", photo);


// any routes containing :userID, our app will first execute userById() method
router.param("userId", userById); // loosk for userId as a parameter and then runs the following method
// any routes containing :postID, our app will first execute postById() method
router.param("postId", postById); // loosk for userId as a parameter and then runs the following method

module.exports = router; // exports router to be used elsewhere
