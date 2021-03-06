const mongoose = require('mongoose')
const Models = require('./models.js')

//to get access to movies and users model

const Movies = Models.Movie
const Users = Models.User

/*  Local Mongo connection
mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
*/

//This allows Mongoose to connect to movie_api database REMOTELY so it can perform CRUD operations
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


// to require express, express-validator, morgan, body parser & CORS
const express = require('express')
morgan = require('morgan')
const app = express()
const bodyParser = require('body-parser')
const { check, validationResult } = require('express-validator')


// using bodyParser
/* body-parser needs to come before other middlewares. If this isn't set up in the correct place, 
client applications will get 401 error, because credentials would not be readable by the server. */
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

uuid = require('uuid')

// using CORS and allowing all domains to make requests
const cors = require('cors')
app.use(cors())

// using auth
let auth = require('./auth')(app)


// using passport.js
/* Passport checks the authorization headers for my requests. This needs to come after body-parser
or else client apps will get 401 responses. */
const passport = require('passport')
require('./passport')


//  log all requests
app.use(morgan('common'))

//Serving Static Files
app.use(express.static('public')) //static file given access via express static

// endpoint for home page and GET welcome message
app.get('/', (req, res) => {
  res.send('Welcome to myFlix!')
})

app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', { root: __dirname })
})

/**
 * GET list of all movies
 * @description Endpoint to get data for all movies.<br>
 * Requires authorization JWT.
 * @method GETAllMovies
 * @param {string} endpoint - /movies
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @returns {object} - JSON object containing data for all movies. Refer to the
 *   Genre: { Name: <string>, Description: <string> },
 *   Director: { Name: <string>, Bio: <string>, Birth: <string>, Death: <string> },
 *   _id: <string>,
 *   Title: <string>,
 *   Description: <string>,
 *   Featured: <boolean>,
 *   ImagePath: <string> (example: "silenceOfTheLambs.png"),
 * ]}
 */
app.get('/movies',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
      .then(function (movies) {
        res.status(201).json(movies);
      })
      .catch(function (error) {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  });

/**
 * GET data about a single movie
 *  @description Endpoint to get data for one movie by title.<br>
 * Requires authorization JWT.
 * @method GETOneMovie
 * @param {string} endpoint - /movies/:Title
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @returns {object} - JSON object containing data for one movie.
 * {
 *   Genre: { Name: <string>, Description: <string> },
 *   Director: { Name: <string>, Bio: <string>, Birth: <string>, Death: <string> },
 *   _id: <string>,
 *   Title: <string>,
 *   Description: <string>,
 *   Featured: <boolean>,
 *   ImagePath: <string> (example: "silenceOfTheLambs.png"),
 * }
 */
app.get('/movies/:Title',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then(movie => {
        res.status(200).json(movie)
      })
      .catch(err => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

/**
 * Get one user
 * @description Endpoint to get data for one.<br>
 * Requires authorization JWT.
 * @method GETOneUsers
 * @param {string} endpoint - /users/:Name
 * @returns {object} - JSON object containing data for one user.
 * {[  _id: <string>,
 *     Name: <string>,
 *     Password: <string> (hashed),
 *     Email: <string>,
 *     Birthday: <string>
 *     FavoriteMovies: [<string>]
 * ]}
 */
app.get('/users/:Name', (req, res) => {
  Users.findOne({ Name: req.params.Name })
    .then(user => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * GET data about a genre (description) by name/title (e.g., ???Drama???)
 *  @description Endpoint to get info about a genre<br>
 * Requires authorization JWT.
 * @method GETOneGenre
 * @param {string} endpoint - /genre/:Name
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @returns {object} - JSON object containing data for one genre.
 * { Name: <string>, Description: <string> }
 */
app.get('/movies/genre/:Name',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Name })
      .then(movie => {
        res.status(200).json(movie.Genre)
      })
      .catch(err => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

/**
 * GET data about a director (bio, birth year, death year) by name
 * @description Endpoint to get info about a director<br>
 * Requires authorization JWT.
 * @method GETOneDirector
 * @param {string} endpoint - /directors/:Name
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @returns {object} - JSON object containing data for one director.
 * { Name: <string>, Bio: <string>, Birth: <string>, Death: <string> },
 */
app.get('/movies/director/:Name',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
      .then(movie => {
        res.status(200).json(movie.Director)
      })
      .catch(err => {
        console.error(err)
        res.status(500).send('Error: ' + err)
      })
  }
)

/**
 * Create new user account
 * @description Endpoint to add a new user<br>
 * Does not require authorization JWT.
 * @method POSTRegisterUser
 * @param {string} endpoint - /users/
 * @param {req.body} object - The HTTP body must be a JSON object formatted as below (but Birthday is optional):<br>
 * {<br>
 * "Name": "johndoe",<br>
 * "Password": "aStrongPasWwOOrd",<br>
 * "Email" : "johndo@gmail.com",<br>
 * "Birthday" : "1995-08-24"<br>
 * }
 * @returns {object} - JSON object containing data for the new user.
 * { _id: <string>,
 *   Name: <string>,
 *   Password: <string> (hashed),
 *   Email: <string>,
 *   Birthday: <string>
 *   FavoriteMovies: []
 * }
 */
app.post('/users',
  [
    check('Name', 'A Name is required').isLength({ min: 5 }),
    check(
      'Name',
      'Name contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('Password', 'Password is required')
      .not()
      .isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ],
  (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    let hashedPassword = Users.hashPassword(req.body.Password)
    Users.findOne({ Name: req.body.Name })
      .then(user => {
        if (user) {
          return res.status(400).send(req.body.Name + ' is already registered')
        } else {
          Users.create({
            Name: req.body.Name,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
            .then(user => {
              res.status(201).json(user)
            })
            .catch(error => {
              console.error(error)
              res.status(500).send('Error: ' + error)
            })
        }
      })
      .catch(error => {
        console.error(error)
        res.status(500).send('Error: ' + error)
      })
  }
)

/**
 * Allow users to add a movie to their list of favorites
 * @description Endpoint to add a movie to a user's favorites<br>
 * Requires authorization JWT.
 * @method POSTAddFavoriteMovie
 * @param {string} endpoint - /users/:Name/:movieID
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @returns {object} - JSON object containing updated user data.
 * { _id: <string>,
 *   Name: <string>,
 *   Password: <string> (hashed),
 *   Email: <string>,
 *   Birthday: <string>
 *   FavoriteMovies: [<string>]
 * }
 */
app.post('/users/:Name/:movieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Name: req.params.Name },
      {
        $addToSet: { FavoriteMovies: req.params.movieID }
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err)
          res.status(500).send('Error: ' + err)
        } else {
          res.status(201).json(updatedUser)
        }
      }
    )
  }
)

/**
 * Allow users to update their user information
 *@description Endpoint to update a user's data<br>
 * Requires authorization JWT.
 * @method PUTUpdateUser
 * @param {string} endpoint - /users/:Name
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @param {req.body} object - The HTTP body must be a JSON object formatted as below (all fields optional):<br>
 * {<br>
 * "Name": "johndoe",<br>
 * "Password": "aStrongPasWwOOrd",<br>
 * "Email" : "johndo@gmail.com",<br>
 * "Birthday" : "1995-08-24"<br>
 * }
 * @returns {object} - JSON object containing updated user data.
 * { _id: <string>,
 *   Name: <string>,
 *   Password: <string> (hashed),
 *   Email: <string>,
 *   Birthday: <string>
 *   FavoriteMovies: [<string>]
 * }
 */
app.put('/users/:Name',
  passport.authenticate('jwt', { session: false }),
  [ //Validation logic
    check('Name', 'Username must be 5 at a minimum characters ').isLength({ min: 5 }),
    check('Name', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ],
  (req, res) => {

    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = req.body.Password ? Users.hashPassword(req.body.Password) : undefined;

    Users.findOneAndUpdate(
      { Name: req.params.Name },
      {
        $set: {
          Name: req.body.Name,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err)
          res.status(500).send('Error: ' + err)
        } else {
          res.status(201).json(updatedUser)
        }
      }
    )
  }
)
/**
 * Allow users to remove a movie from their list of favorites
 * @description Endpoint to remove a movie to a user's favorites<br>
 * Requires authorization JWT.
 * @method DELETERemoveFavoriteMovie
 * @param {string} endpoint - /users/:Name/:movieID
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @returns {object} - JSON object containing updated user data.
 * { _id: <string>,
 *   Name: <string>,
 *   Password: <string> (hashed),
 *   Email: <string>,
 *   Birthday: <string>
 *   FavoriteMovies: [<string>]
 * }
 */
app.delete('/users/:Name/:movieID',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Users.findOneAndUpdate(
      { Name: req.params.Name },
      {
        $pull: { FavoriteMovies: req.params.movieID }
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
        if (err) {
          console.error(err)
          res.status(500).send('Error: ' + err)
        } else {
          res.status(200).json(updatedUser)
        }
      }
    )
  }
)

/**
 * Allow existing users to deregister
 * @description Endpoint to delete a user account<br>
 * Requires authorization JWT.
 * @method DELETEUserAccount
 * @param {string} endpoint - /users/:Name
 * @param {req.headers} object - headers object containing the JWT formatted as below:<br>
 * { "Authorization" : "Bearer <jwt>"}
 * @returns {string} - A string containing the message: "<Name> successfully deleted."
 */
app.delete('/users/:Name', (req, res) => {
  Users.findOneAndRemove({ Name: req.params.Name })
    .then(user => {
      if (!user) {
        res.status(400).send(req.params.Name + ' was not found')
      } else {
        res.status(200).send(req.params.Name + ' was deleted.')
      }
    })
    .catch(err => {
      console.error(err)
      res.status(500).send('Error: ' + err)
    })
})

//Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Something isn't working!")
})

// open server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
