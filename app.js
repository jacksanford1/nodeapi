const express = require("express"); // npm module that makes it easier to deal with HTTP servers
const app = express(); // express module docs require us to do this, allows us to use the app.XX functions later on
const mongoose = require("mongoose"); // npm module that helps us talk to MongoDB in an easier way
const morgan = require("morgan"); // npm module that causes the local server to constantly check for updates (instead of requiring manual refresh)
const bodyParser = require("body-parser"); // npm module that parses incoming requests (in our case in json)
const cookieParser = require("cookie-parser"); // parses the cookie used by frontend to authenticate logged-in users (?)
const expressValidator = require("express-validator"); // npm module that gives us better error messages, allows us to use the "check" method
const fs = require("fs"); // core nodeJS module call file system, will give us access to the file system
const cors = require("cors"); // npm module that allows for cross-origin resource sharing, our backend may be hosted on 8080 and our frontend on 3000 and because of cors this won't be an issue
const dotenv = require("dotenv"); // npm module allows us to use a .env file to create environment variables which are referenced using process.env
dotenv.config(); // dotenv npm module requires that we do this in order for it to work

// db
mongoose.connect(process.env.MONGO_URI, // mongoose helps connect to MongoDB server, uses dotenv and process.env to get variable from the .env file
  { useNewUrlParser: true } // some error showed up in terminal during setup and asked us to write this in
)
.then(() => console.log("DB Connected")); // this shows us in terminal on successful connection to MongoDB

mongoose.connection.on('error', err => { // this knows if the connection had an error
  console.log(`DB connection error: ${err.message}`); // prints the error message
});

// bring in routes
const postRoutes = require("./routes/post"); // brings in the "router" thing (method?) from post.js file (believe this is used to decide which page to show in the browser)
const authRoutes = require("./routes/auth"); // brings in the "router" thing (method?) from auth.js file (believe this is used to decide which page to show in the browser)
const userRoutes = require("./routes/user"); // brings in the "router" thing (method?) from auth.js file (believe this is used to decide which page to show in the browser)
// apiDocs
app.get("/api", (req, res) => { // this is a direct route to the homepage where we will have some api info for now
  fs.readFile("docs/apiDocs.json", (err, data) =>{ // readFile is a function through fs and we are pointing at our json file we want it to read
    if(err) {
      res.status(400).json({ // standard error checking
        error: err // returns the raw error
      });
    }
    const docs = JSON.parse(data); // this parses the JSON data
    res.json(docs); // this will spit out the apiDocs file so users know how to use our api
  });
});

// middleware
app.use(morgan("dev")); // makes sure the local server constantly checks for updates, ".use" specifies middleware as the callback function
app.use(bodyParser.json()); // tells the system that you want it to use json
app.use(cookieParser()); // this is how you use the cookie parser that deals with user authentication on the frontend
app.use(expressValidator()); // makes errors look nicer, allows us to use "check" method
app.use(cors()); // allows for cross-origin resource sharing, our backend may be hosted on 8080 and our frontend on 3000 and because of cors this won't be an issue
app.use("/api", postRoutes);  // I think this is what the routes folder feeds into; can leave as "/" here because the right path is handled in routes folder
app.use("/api", authRoutes);  // I think this is what the routes folder feeds into; can leave as "/" here because the right path is handled in routes folder
app.use("/api", userRoutes);  // I think this is what the routes folder feeds into; can leave as "/" here because the right path is handled in routes folder
app.use(function (err, req, res, next) { // this whole function comes from the express-jwt page in the "error handling" section, deals with trying to access protected routes as an unauthorized user
  if (err.name === 'UnauthorizedError') { // if the error is exactly equal to unauthorizedError, then we will display the below
    res.status(401).json({error: "Unauthorized!"}); // gives a 401 status and a json error response
  }
});

const port = process.env.PORT || 8080; // uses dotenv and process.env to call PORT from the .env file
console.log(port);
app.listen(port, () => {
  console.log(`A node JS API is listening on port: ${port}`); // This prints on terminal whenever the server restarts
});
