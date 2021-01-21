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
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  if (cookieHasUser(req.session.user_id, users)) {
    let templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

/********************************************************************************************************** */

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});


app.post("/urls", (req, res) => {
  //console.log(req.session.user_id);
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
  if (urlDatabase[req.params.shortURL]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      urlUserID: urlDatabase[req.params.shortURL].userID,
      user: users[req.session.user_id],
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("The short URL you entered does not correspond with a long URL at this time.");
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
  const submittedEmail = req.body.email;
  const submittedPassword = req.body.password;

  if (!emailLookUp(submittedEmail, users)) {

    res.status(403).send('Invalid request');

  } else if (!submittedEmail || !submittedPassword) {

    res.redirect(403, '/login');
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

app.post('/logout', (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/urls');
});

/********************************************************************************************************** */

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
  const submittedEmail = req.body.email;
  const submittedPassword = req.body.password;

  if (!submittedEmail || !submittedPassword) {
    res.status(400).send("Please include both a valid email and password");
  } else if (emailLookUp(submittedEmail, users)) {
    res.status(400).send("An account already exists for this email address");
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

app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.id)) {
    const shortURL = req.params.id;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.status(401).send("You don't have authorization to edit this short URL.");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
