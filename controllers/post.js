const Post = require("../models/post"); // imports the Post schema to be used as a model according to mongoose
const formidable = require('formidable'); // npm package for helping to parse file uploads
const fs = require('fs'); // core nodeJS module call file system, will give us access to the file system
const _ = require('lodash'); // imports npm module called lodash which has helpful methods for updating user profiles (?)


exports.postById = (req, res, next, id) => {
  Post.findById(id) // this findById method is part of mongoose, interacts with the mongoose model, will either return us a post or an error
  .populate("postedBy", "_id name") // allows you to get data from postedBy and choose which fields you want to show, have to use this instead of select because postedBy references a different model (User instead of Post)
  .populate("comments.postedBy", "_id name")
  .populate("postedBy", "_id name role")
  .exec((err, post) => { // executes based on which variable we get (I think)
    if (err || !post) {
      return res.status(400).json({
        error: err
      });
    }
    req.post = post; // adds the post to the request object
    next(); // this method will be applied as a middleware to a route, so want to make sure it continues on to the next phase or middleware
  });
};

exports.getPosts = (req, res) => {  // creates a new promise (?) called getPosts with two variables passed in
  const posts = Post.find()
    .populate("postedBy", "_id name") // allows you to get data from postedBy and choose which fields you want to show, have to use this instead of select because postedBy references a different model (User instead of Post)
    .populate("comments", "text created")
    .populate("comments.postedBy", "_id name")
    .select("_id title body created likes") // creates new posts variable which uses the Post model imported in; find finds documents in that model; select only returns specified criteria
    .sort({created: -1 }) // sorts the post so that the most recently posted post comes first
    .then(posts => { // then has to do with promises in javascript, once the promise is fulfilled, believe the code after then is executed
      res.json(posts); // sends a json response composed of the specified data
    })
    .catch(err => console.log(err)); // .catch deals with rejected promise cases only and then put out an error message
};


exports.createPost = (req, res, next) => { // creates a new promise (?) called createPost with two variables passed in
  let form = new formidable.IncomingForm(); // part of the formidable npm package, will give us the incoming form fields, helps us handle files
  form.keepExtensions = true; // we want to keep the form format extensions like jpeg, etc.
  form.parse(req, (err, fields, files) => { // this tells us what we want out of the form (using parse)
    if(err) {
      return res.status(400).json({ // standard error checking
        error: "Image could not be uploaded"
      });
    }
    let post = new Post(fields); // we are really just creating a new post, and we want to have access to all the fields here

    req.profile.hashed_password = undefined; // makes it so that this field doesn't show up when the user profile is pulled
    req.profile.salt = undefined; // makes it so that this field doesn't show up when the user profile is pulled
    post.postedBy = req.profile; // this is using the postedBy field in the post Schema and assigning the authenticated user fields to it from req.profile
    console.log("PROFILE", req.profile);

    if(files.photo) {
      post.photo.data = fs.readFileSync(files.photo.path); // reads the photo path and stores the file
      post.photo.contentType = files.photo.type; // gives us and saves the type of photo (jpg, png, etc.)
    }
    post.save((err, result) => { // saving the post here, we will get either an error or a result
      if(err) {
        return res.status(400).json({ // standard error handling
          error: err // this simply returns whatever error message we get
        });
      }
      res.json(result); // result is the post, no wrapper or anything, just giving json response with that post we just created
    });
  });
};

exports.postsByUser = (req, res) => { // this is trying to get all the posts by a specific user
  Post.find({postedBy: req.profile._id}) // this is finding all posts by a certain profile id i.e. a specific user
    .populate("postedBy", "_id name") // again using populate instead of select because we are in the Post model but postedBy references data in the User model
    .select("_id title body created likes") // creates new posts variable which uses the Post model imported in; find finds documents in that model; select only returns specified criteria
    .sort("_created") // sorts based on the created date
    .exec((err, posts) => { // will either get an error or get the posts
      if(err) {
        return res.status(400).json({
          error: err
        });
      }
      res.json(posts); // don't need the wrapper ({posts: posts}) here, can directly use posts (not totally sure why)
    });
};

exports.isPoster = (req, res, next) => { // this is going to determine if the current logged in user is the poster of a specific post
  let isPoster = req.post && req.auth && req.post.postedBy._id == req.auth._id; // if req.post and req.auth are both included in the request AND they match, then we're all good - this threw an error at one point because we used strict equality === instead of loose equality ==

  // console.log("req.post: ", req.post);
  // console.log("req.auth: ", req.auth);
  // console.log("req.post.postedBy._id: ", req.post.postedBy._id);
  // console.log("req.auth._id: ", req.auth._id);

  if(!isPoster) { // if not the poster
    return res.status(403).json({ // then you get an error
      error: "User is not authorized"
    });
  }
  next(); // if you ARE the poster, continues on
};

// exports.updatePost = (req, res, next) => { // this is for making a change to an already-existing post
//   let post = req.post; // able to use this because we have already run postById and put the post info into req.post
//   post = _.extend(post, req.body); // uses lodash (_) and extend to mutate the currently existing post with the change in your request
//   post.updated = Date.now(); // creates the updated field which puts a timestamp on when we changed the post
//   post.save(err => { // this saves the post and also leaves room for an error that may come through
//     if(err) {
//       return res.status(400).json({
//         error: err // returns whatever error is coming through
//       });
//     }
//     res.json(post); // this returns the json of the updated post (still using save method)
//   });
// };

exports.updatePost = (req, res, next) => { // this method handles the form, makes changes to the user model and then saves
  let form = new formidable.IncomingForm() // handles the incoming form request
  form.keepExtensions = true // because we want to keep the extensions
  form.parse(req, (err, fields, files) => { // fields checks for fields like name, email, files check for files
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded"
      })
    }
    // save posts
    let post = req.post
    post = _.extend(post, fields) // this uses lodash to mutate the current fields
    post.updated = Date.now() // updates the date for when the user last updated their profile

    if(files.photo) { // if there are files attached
      post.photo.data = fs.readFileSync(files.photo.path) // our user model has a photo.data section, fs is reading the file, not sure what else happens here
      post.photo.contentType = files.photo.type // this line and the readFileSync line is about taking the data we get and populating the user model
    }

    post.save((err, result) => { // saving the updated result to the user model
      if (err) {
        return res.status(400).json({ // standard error handling
          error:err
        })
      }
      res.json(post);
    })
  })
}

exports.deletePost = (req, res) => { // this is for deleting a specific post
  let post = req.post; // can use req.post because by including :post in the URL, postById has already run and created req.post
  post.remove((err, post) => { // removes the post, returns either an error or the successfully deleted post
    if(err) {
      return res.status(400).json({
        error: err
      });
    }
    res.json({
      message: "Post deleted successfully"
    });
  });
};

exports.photo = (req, res, next) => {
  res.set("Content-Type", req.post.photo.contentType);
  return res.send(req.post.photo.data);
};

exports.singlePost = (req, res) => {
  return res.json(req.post); // we have already created the req.post in the exports.postById method at the top
};

exports.like = (req, res) => {
  Post.findByIdAndUpdate( // findByIdAndUpdate is part of mongoose, post will be found and then the likes will be pushed, if we don't include new it will return the old post
    req.body.postId,
    {$push: {likes: req.body.userId}},
    {new: true}
  ).exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      })
    } else {
      res.json(result)
    }
  })
}

exports.unlike = (req, res) => {
  Post.findByIdAndUpdate( // findByIdAndUpdate is part of mongoose, post will be found and then the likes will be pulled, if we don't include new it will return the old post
    req.body.postId,
    {$pull: {likes: req.body.userId}}, // this one pulls instead of pushes
    {new: true}
  ).exec((err, result) => {
    if(err) {
      return res.status(400).json({
        error: err
      })
    } else {
      res.json(result)
    }
  })
}

exports.comment = (req, res) => {
  let comment = req.body.comment;
  comment.postedBy = req.body.userId;

  Post.findByIdAndUpdate( // findByIdAndUpdate is part of mongoose, post will be found and then the likes will be pushed, if we don't include new it will return the old post
    req.body.postId,
    { $push: { comments: comment }},
    { new: true }
  )
  .populate("comments.postedBy", "_id name")
  .populate("postedBy", "_id name")
  .exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    } else {
      res.json(result);
    }
  });
}

exports.uncomment = (req, res) => {
  let comment = req.body.comment

  Post.findByIdAndUpdate( // findByIdAndUpdate is part of mongoose, post will be found and then the likes will be pushed, if we don't include new it will return the old post
    req.body.postId,
    { $pull: { comments: { _id: comment._id }}},
    { new: true }
  )
  .populate("comments.postedBy", "_id name")
  .populate("postedBy", "_id name")
  .exec((err, result) => {
    if (err) {
      return res.status(400).json({
        error: err
      });
    } else {
      res.json(result);
    }
  })
}
