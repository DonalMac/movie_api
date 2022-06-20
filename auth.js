const jwtSecret = 'your_jwt_secret'; // This has to be the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport'); // Your local passport file

/**
 * @description Generates a JWT for a user and returns the token as a string
 * @method generateJWTToken
 * @param {object} user Object containing all of the user's data
 * @returns {string} - JWT for the logged in user
 */
let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Name, // This is the username you’re encoding in the JWT
    expiresIn: '7d', // This specifies that the token will expire in 7 days
    algorithm: 'HS256' // This is the algorithm used to “sign” or encode the values of the JWT
  });
}


/**
 * After login.
 *  @description Endpoint to login the user<br>
 * @method POSTLoginUser
 * @param {string} endpoint - /login?Name=[Name]&Password=[Password]
 * @returns {object} - JSON object containing data for the user and a new JWT.
 * { user: {
 *   _id: <string>,
 *   Name: <string>,
 *   Password: <string> (hashed),
 *   Email: <string>,
 *   Birthday: <string>,
 *   FavoriteMovies: [<string>]
 *   },
 *   token: <string>
 * }
 */
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user: user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
}
