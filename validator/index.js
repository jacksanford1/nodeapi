exports.createPostValidator = (req, res, next) => { // creates a new variable "createPostValidator" with three inputs
// title
  req.check('title', "Write a title").notEmpty(); // this is using npm module expressValidator to check that the "title" field is not empty and gives a text response if it is empty
  req.check('title', "Title must be between 4 to 150 characters").isLength({
    min: 4,
    max: 150
  }); // same as first req.check but checks the length of the "title" req input and specifies criteria (min, max) to check against
// body
  req.check('body', "Write a Body").notEmpty(); // makes sure the "body" req input is not empty
  req.check('body', "Body must be between 4 to 2000 characters").isLength({
    min: 4,
    max: 2000
  }); // same as above but for the body
  // check for errors
  const errors = req.validationErrors(); // req.validationErrors returns the errors (if any) from the checks above
  // if error show the first one as they happen
  if (errors) {
    const firstError = errors.map((error) => error.msg)[0]; // the map function stores the errors in order so using [0] refers to the first error incurred...not sure about .msg but I assume it returns the error message associated with an error
    return res.status(400).json({error: firstError}); // express gives us res.status as the way to declare errors - the .json returns the error field in json format
  }
  // proceed to next middleware
  next(); // we need this to not get stuck in never-ending middleware loop; continues whether there is an error or not
};

exports.userSignupValidator = (req, res, next) => { // creates a new function for validating user sign-ins
  // name is not null and between 4-10 characters
  req.check("name", "Name is required").notEmpty(); // same as above, checking that the "name" field isn't empty
  // email is not null, valid and noramlized
  req.check("email", "Email must be between 3 to 32 characters")
  .matches(/.+\@.+\..+/) // using regular expressions to check for a normalized email
  .withMessage("Email must contain @") // chain seems to go in order so this only applies to the regular expression check on line above
  .isLength({ // same as above
    min: 4,
    max: 2000 // not sure why he chose 2000 and said 32 characters above
  })
  // check for password
  req.check("password", "Password is required").notEmpty(); // same as above
  req.check("password")
  .isLength({min: 6}) // password must be at least 6 characters long
  .withMessage("Password must contain at least 6 characters") // method chaining and this message only applies to check requirment directly preceding it
  .matches(/\d/) // More regular expressions simply saying the password must have a number in it
  .withMessage("Password must contain a number")
  // check for errors
  const errors = req.validationErrors(); // req.validationErrors returns the errors (if any) from the checks above
  // if error show the first one as they happen
  if (errors) {
    const firstError = errors.map((error) => error.msg)[0]; // the map function stores the errors in order so using [0] refers to the first error incurred...not sure about .msg but I assume it returns the error message associated with an error
    return res.status(400).json({error: firstError}); // express gives us res.status as the way to declare errors - the .json returns the error field in json format
  }
  // proceed to next middleware
  next();
}

exports.passwordResetValidator = (req, res, next) => {
  // check for password
  req.check("newPassword", "Password is required").notEmpty();
  req.check("newPassword")
    .isLength({min:6})
    .withMessage("Password must be at least 6 chars long")
    .matches(/\d/)
    .withMessage("must contain a number")
    .withMessage("Password must contain a number");

  // check for errors
  const errors = req.validationErrors();
  // if error show the first one as they happen
  if (errors) {
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error: firstError});
  }
  // proceed to next middleware, etc.
  next();
};
