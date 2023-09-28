//This code imports required modules and sets up the Express application.
const express = require('express');
const bodyParser = require('body-parser');
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./key.json'); // Replace with your own path
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
//This code sets up Express middleware for serving static files, parsing form data, managing sessions, and configuring the view engine.
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize Firebase Admin SDK
const firebaseConfig = {
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://your-firebase-project.firebaseio.com', // Replace with your Firebase project's URL
};

firebaseAdmin.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebaseAdmin.firestore();

// Define routes
app.get('/', (req, res) => {
    console.log('Received a GET request for /');
    res.render('index');
});

// Signup route
app.get('/signupform', (req, res) => {
    console.log('Received a GET request for /signupform');
    res.render('signupform');
});
//This code handles user sign-up and checks for existing email
// in Firestore before proceeding with registration or showing an error message.
app.post('/signupform', async (req, res) => {
    const { username, password } = req.body;

    try {
      const userRef = db.collection('userDemo').doc(username);
      const docSnapshot = await userRef.get();

      if (docSnapshot.exists) {
        res.send("Email already registered. Please choose a different one.");
      } else {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
          FullName: username,
          Password: hashedPassword,
        };
  
        await userRef.set(userData);
  
        res.send("Registration successful. Please login.");
      }
    } catch (error) {
      res.status(500).send("Error: " + error);
    }
});

// Login route
app.get('/loginform', (req, res) => {
    console.log('Received a GET request for /loginform');
    res.render('loginform');
});
//This code handles user login, checks if the user exists, and compares the entered password with the  
// hashed password from Firestore before redirecting or displaying an error message.
app.post('/loginform', async (req, res) => {
    const { username, password } = req.body;

    try {
      const userRef = db.collection('userDemo').doc(username);
      const docSnapshot = await userRef.get();
      
      if (docSnapshot.exists) {
        const hashedPassword = docSnapshot.data().Password;
  
        // Compare the entered password with the hashed password from Firestore
        const result = await bcrypt.compare(password, hashedPassword);
  
        if (result) {
          // Redirect to the weather page on successful login
          req.session.user = username; // Set a session variable to track authentication
          res.redirect('/movies'); // Assuming you have a '/movies' route
        } else {
          res.send("Login failed. Please check your credentials.");
        }
      } else {
        res.send("Login failed. User not found.");
      }
    } catch (error) {
      res.status(500).send("Error: " + error);
    }
});

// Movie interface route
app.get('/movies', (req, res) => {
    // Check if the user is authenticated (based on the session)
    if (req.session.user) {
        res.render('movies'); // Render the movies.ejs template
    } else {
        res.redirect('/loginform'); // Redirect to the login page if not authenticated
    }
});

// Start the server
const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});