const mongoose = require("mongoose"); // npm module that helps us talk to MongoDB in an easier way
const uuidv1 = require('uuid/v1'); // npm module that creates a "universally unique identifier" based on a timestamp
const crypto = require('crypto'); // npm module that enables cryptographic functionality (we use below for passwords)
const {ObjectId} = mongoose.Schema;

const userSchema = new mongoose.Schema({ // creates the schema that maps to the MongoDB collection and defines the shape of the documents within that collection
  name: {
    type: String, // name has to be a string
    trim: true, // if there is a blank space before name, it is ignored
    required: true // name is a required field
  },
  email: {
    type: String,
    trim: true,
    required: true
  },
  hashed_password: { // hashing translates your password into a unique character set that is the same everytime but very hard to reverse engineer into the original password
    type: String,
    required: true
  },
  salt: String, // a salt is unique random characters added to a hashed password in order to protect against rainbow table attacks - it is only randomly generated once per password then it is saved (I think?)
  created: {
    type: Date,
    default: Date.now // I think this creates the timestamp for the document created (?)
  },
  updated: Date, // tells you if the document (?) has been updated
  photo: { // this is for photos
    data: Buffer, // this stores the binary for the photo
    contentType: String // stores the type of image, jpg, etc.
  },
  about: {
    type: String,
    trim: true
  },
  following: [{type: ObjectId, ref: "User"}],
  followers: [{type: ObjectId, ref: "User"}],
  resetPasswordLink: {
    data: String,
    default: ""
  },
  role: {
    type: String,
    default: "subscriber"
  }
});

// virtual field
userSchema.virtual("password") // virtuals are additional fields for a given model that don't get persisted in the database - we are naming this virtual "password"
.set(function(password) { // uses a setter method and defines a function with password as the input
  // create temporary variable called hashed_password
  this._password = password
  // generate a timestamp
  this.salt = uuidv1() // creates a unique string of characters (based on a timestamp) to be used as the salt
  // encryptPassword()
  this.hashed_password = this.encryptPassword(password) // uses the encryptPassword function (defined below) on password and saves it as this.hashed_password
})
.get(function() {
  return this._password // uses a getter method to define a function which returns this._password
})

// methods
userSchema.methods = { // .methods seems to just add a particular method to the userSchema model (in this case it looks to be encryptPassword)
  authenticate: function(plainText) { // this ties into our front-end user authentication, plainText is the plain password
    return this.encryptPassword(plainText) === this.hashed_password // Will return true if it matches; this is a check to see if the new password used for authentication matches the password used to register the account (after both are encrypted)
  },

  encryptPassword: function(password) { // defining a new method for userSchema called encryptPassword
    if(!password) return ""; // if there is no password, returns an empty string
    try {
      return crypto.createHmac('sha1', this.salt) // hmac = hash-based message authentication code where sha1 is the type of HMAC produced and this.salt is the unique uuidv1 generated in the setter above
                   .update(password) // seems like this just puts the password variable as the newly generated hmac password
                   .digest('hex'); // gets the output according to https://nodejs.org/api/crypto.html
    } catch (err) {
      return ""; // if it fails it returns an empty string
    }
  }
}


module.exports = mongoose.model("User", userSchema); // creates a model from the postSchema schema which is then used to create document instances
