const express = require("express");
morgan = require("morgan");
const app = express();
bodyParser = require('body-parser'),
uuid = require('uuid');

app.use(morgan("common"));

let users = [
  {
    id: 1,
    name: 'Jessica Drake',
    favouriteMovies: ["Scarface"]
    },
  {
    id: 2,
    name: 'Ben Cohen',
    favouriteMovies: []
  },
  {
    id: 3,
    name: 'Lisa Downing',
    favouriteMovies: []
  }
];

let movies = [
  {
    Title: "Scarface", Description: "",
  Director: { Name: "Brian De Palma", Bio: "" },
   Genre: { Name: "Gangster",  Description:""}
 },

 {
   Title: "Goodfellas", Description: "",
 Director: { Name: "Martin Scorsese", Bio: "" },
  Genre: { Name: "Biography",  Description:""}
},

{
  Title: "Dumb and Dumber", Description: "",
Director: { Name: "Peter Farrelly", Bio: "" },
 Genre: { Name: "Comedy",  Description:""}
}
];

//Serving Static Files
app.use(express.static("public")); //static file given access via express static

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to myFlix!");
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

app.use(bodyParser.json());

// Gets the list of data about ALL movies
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// Gets the data about a single movie, by title
app.get('/movies/:title', (req, res) => {

  const {title} = req.params;
  const movie = movies.find(movie => movie.Title === title);
  if (movie){
    res.status(200).json(movie);
  }else{
    res.status(400).send("Movie not in Database");
  }
});

//Returns data about a genre by name
app.get("/movies/genre/:name", (req,res) => {

  const {name} = req.params;
  const genre = movies.find(movie => movie.Genre.Name === name).Genre;
  if (genre){
    res.status(200).json(genre);
  }else{
    res.status(400).send("genre not in Database");
  }
});

//Returns data about a director by name
app.get("/movies/director/:name", (req,res) => {

    const {name} = req.params;
    const director = movies.find(movie => movie.Director.Name === name).Director;
    if (director){
      res.status(200).json( director);
    }else{
      res.status(400).send("director not in Database");
    }
  });

// Allows new users to register
app.post('/users', (req, res) =>  {
  let newUser = req.body;

  if (!newUser.name) {
    const message = 'Missing name in request body';
    res.status(400).send(message);
  } else {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).send(newUser);
  }
});

//Allows users to update their user info
app.put("/users/:username", (req,res) =>  {
    const {username} = req.params;
    const updatedUser = req.body;

    let user = users.find (user => user.name === username);

  if (user) {
    user.name = updatedUser.name;
    res.status(201).json(user);
  } else {
    res.status(400).send("No such user");
  }
});

//Allows users to add a movie to their list of favorites
app.post("/users/:username/:movieTitle", (req,res) =>  {
  const {username, movieTitle} = req.params;

  let user = users.find (user => user.name === username);

  if (user) {
    user.favouriteMovies.push(movieTitle);
    res.status(200).send(req.params.movieTitle + ' has been added to ' + user.name + 's array');
  } else {
  res.status(400).send('No such user');
  }
});

//Allows users to delete a movie from their list of favorites
app.delete("/users/:username/:movieTitle", (req,res) =>  {
  const {username, movieTitle} = req.params;

  let user = users.find (user => user.name === username);

  if (user) {
    user.favouriteMovies = user.favouriteMovies.filter(title => title !== movieTitle);
    res.status(200).send(req.params.movieTitle + ' was removed from ' + user.name + 's favorites list.');
  } else {
  res.status(400).send('No such user');
  }
});

// Deletes a user after deregistration
app.delete('/users/:username', (req, res) => {
  const {username} = req.params;

  let user = users.find (user => user.name === username);

  if (user) {
    users = users.filter(user => user.name !== username);
    res.status(200).send('${username} has been deregistered from the database');
  } else {
  res.status(400).send('No such user');
  }
});

//Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something isn't working!");
});



// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});
