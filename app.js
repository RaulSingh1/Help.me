const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require('method-override');
const session = require('express-session');

const app = express();

const path = require("path")

const default_routes = require("./router/default_routes.js");
const quote_routes = require("./router/quotes_routes.js");
const auth_routes = require("./router/auth_routes.js");
const authController = require("./controllers/authController.js");

mongoose.connect("mongodb://10.12.2.181:27017/quotes", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

app.use(express.urlencoded({extended:true}))

app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: 'your-secret-key-here', // In production, use environment variable
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Pass user to all views
app.use(authController.passUserToView);

app.listen(3000, ()=>{
    console.info("Successfully running the server");
});

app.use(default_routes);
app.use('/auth', auth_routes);
app.use('/quotes', quote_routes);
