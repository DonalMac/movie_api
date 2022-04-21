const mongoose = require('mongoose')
const Models = require('./models.js')

const Movies = Models.Movie
const Users = Models.User

/*  Local Mongo connection
mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
*/

// Mongo to Heroku connect
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const express = require('express')
morgan = require('morgan')
const app = express()
const bodyParser = require('body-parser')
const { check, validationResult } = require('express-validator')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

uuid = require('uuid')

const cors = require('cors')
app.use(cors())

let auth = require('./auth')(app)

const passport = require('passport')
require('./passport')

app.use(morgan('common'))

//Serving Static Files
app.use(express.static('public')) //static file given access via express static

// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to myFlix!')
})

app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', { root: __dirname })
})

// Gets the list of data about ALL movies 2.8
app.get(  '/movies',
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

// Gets the data about a single movie, by title 2.8
app.get(  '/movies/:Title',
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

//Returns data about a genre by name 2.8
app.get(  '/movies/genre/:Name',
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

//Returns data about a director by name 2.8
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

//Get a user by username
app.get('/users/:Name', (req, res) => {
  Users.findOne({ name: req.params.Name })
    .then ((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//Allows creation of new user 2.8
app.post( '/users',
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

//Allows users to add a movie to their list of favorites 2.8
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

//UPDATE Allows users to update their user info 2.8
app.put('/users/:Name',
  passport.authenticate('jwt', { session: false }),
  [ //Validation logic
  check('Name', 'Username must be 5 at a minimum characters ').isLength({min: 5}),
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

    Users.findOneAndUpdate(
      { Name: req.params.Name },
      {
        $set: {
          Name: req.body.Name,
          Password: req.body.Password,
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
//Allows users to delete a movie from their list of favorites 2.8
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

// Deletes a user after deregistration 2.8
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

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});
