const express = require("express");
morgan = require("morgan");
const app = express();

let topMovies = [
  {
    title: "The Departed",
    director: "Michael Scorsese"
  }
];

app.use(morgan("common"));

//Serving Static Files
app.use(express.static("public")); //static file given access via express static

// GET requests
app.get("/", (req, res) => {
  res.send("Welcome to myFlix!");
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

app.get("/movies", (req, res) => {
  res.json(topMovies);
});

app.get("/secreturl", (req, res) => {
  res.send("This is a secret url with super top-secret content.");
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
