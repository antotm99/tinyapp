const express = require("express");
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const saltRounds = 10;
const { emailLookUp, getUserByEmail, cookieHasUser, urlsForUser } = require('./helpers');
/********************************************************************************************************** */

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['ANTO'],
}));

app.set("view engine", "ejs");

/********************************************************************************************************** */

//Generate a random 6 character string
const generateRandomString = function() {
  let randomString = Math.random().toString(36).substring(2,8);
  return randomString;
};

/********************************************************************************************************** */
  
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

/********************************************************************************************************** */

app.get("/", (req, res) => {
  res.send("Welcome!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls/new", (req, res) => {
  //If one of our cookies is equal to a user, show the '/urls/new' page
  if (cookieHasUser(req.session.user_id, users)) {
    let templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_new", templateVars);
    //If we are not logged in, then send them back to the login page
  } else {
    res.redirect("/login");
  }
});

/********************************************************************************************************** */

app.get("/urls", (req, res) => {
  //You don't need to be logged in to see the front page, 
  //but you don't see any URLs since your not logged in
  let templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});


app.post("/urls", (req, res) => {
  //Will show URLs of the user on this page if you are logged in
  if (req.session.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).send("You must be logged in to a valid account to create short URLs.");
  }
});

/********************************************************************************************************** */

app.get("/urls/:shortURL", (req, res) => {
  //If the short URL you entered is in the database under the users account it will show you this page with the Short URL
  if (urlDatabase[req.params.shortURL]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      urlUserID: urlDatabase[req.params.shortURL].userID,
      user: users[req.session.user_id],
    };
    res.render("urls_show", templateVars);
    //If you enter a wrong Short URL this error message will come up
  } else {
    res.status(404).send("The short URL you entered does not match with a long URL.");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(401).send("You don't have authorization to delete this short URL.");
  }
});

app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

/********************************************************************************************************** */

app.get('/login', (req, res) => {
  if (cookieHasUser(req.session.user_id, users)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_login", templateVars);
  }
});

app.post('/login', (req, res) => {
  //Entered email
  const submittedEmail = req.body.email;
  //Entered password
  const submittedPassword = req.body.password;
  //If Email is not in our users database you will get an error
  if (!emailLookUp(submittedEmail, users)) {

    res.status(403).send('Invalid request');
  //If either the email or password does not match you will be redirected to the Login page
  } else if (!submittedEmail || !submittedPassword) {

    res.redirect(403, '/login');
    //If the email and password match, the password entered will be bcrypted to equal to the saved password in our database
  } else {
    const user = getUserByEmail(submittedEmail, users);
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(submittedPassword, salt);
    //console.log('this is hash', hash);
    //console.log('this is salt', salt);
    if (bcrypt.compareSync(submittedPassword, hash)) {
      req.session.user_id = user.id;
      res.redirect('/urls');
    } else {
      res.status(403).send('The user name/password is incorrect');
    }
  }
});

/********************************************************************************************************** */
//Logout will clear the cookies for that session and redirect you to the '/urls' page
app.post('/logout', (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/urls');
});

/********************************************************************************************************** */
//Registration page
app.get('/register', (req, res) => {
  if (cookieHasUser(req.session.user_id, users)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_register", templateVars);
  }
});

app.post('/register', (req, res) => {
  //Entered email
  const submittedEmail = req.body.email;
  //Entered password
  const submittedPassword = req.body.password;
  //If the email or password are not valid, it will give you an error
  if (!submittedEmail || !submittedPassword) {
    res.status(400).send("Please include a valid email and password");
    //If the email is in our users database, then you will get an error
  } else if (emailLookUp(submittedEmail, users)) {
    res.status(400).send("An account already exists for this email address");
    //If both email and password are valid, it will generate a random 6 character string for the user cookie
    //and it will bcrypt the password and save it bcrypted in our database for security
  } else {
    const newUserID = generateRandomString();
    users[newUserID] = {
      id: newUserID,
      email: submittedEmail,
      password: bcrypt.hashSync(submittedPassword, 10)
    };

    req.session.user_id = newUserID;
    res.redirect('/urls');
  }
});

/********************************************************************************************************** */


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
