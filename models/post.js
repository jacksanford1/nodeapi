const mongoose = require("mongoose"); // npm module that helps us talk to MongoDB in an easier way
const {ObjectId} = mongoose.Schema; // just a fancier way of using the ObjectId property of mongoose.Schema

const postSchema = new mongoose.Schema({ // Everything in Mongoose starts with a Schema. Each schema maps to a MongoDB collection and defines the shape of the documents within that collection.
  title: {
    type: String, // title has to be a string
    required: true // there has to be a title
  },
  body: {
    type: String,
    required: true
  },
  photo: { // we will come back to photo later apparently but doens't hurt to have it and doesn't hurt if there is no photo included in a post
    data: Buffer, // some kind of Nodejs thing where when it's coming, before it's received, it will be available in Buffer; this will be the image data in binary format
    contentType: String // this will be png, jpeg, etc.
  },
  postedBy: { // this is how we will attach a user to their post
    type: ObjectId, // if we hadn't done {ObjectId} above, this would be mongoose.Schema.ObjectId
    ref: "User" // references User model in mongoose, basically gives you access to everything in the User model
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: Date, // tells you if the document (?) has been updated
  likes: [{type: ObjectId, ref: "User"}],
  comments: [
    {
      text: String,
      created: { type: Date, default: Date.now },
      postedBy: { type: ObjectId, ref: "User" }
    }
  ]
});

module.exports = mongoose.model("Post", postSchema); // creates a model from the postSchema schema which is then used to create document instances
