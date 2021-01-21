const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const saltRounds = 10;
/********************************************************************************************************** */

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs");

/********************************************************************************************************** */

const generateRandomString = function() {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/********************************************************************************************************** */

const emailLookUp = function (email,users) {
  for (user in users) {
    if (users[user].email === email) {
      return true 
    }
  } 
  return false
 };

 const findUserByEmail = function (email,users) {
  for (user in users) {
    if (users[user].email === email) {
      return users[user]
    }
  }
return false;
};

const cookieHasUser = function(cookie, userDatabase) {
  for (const user in userDatabase) {
    if (cookie === user) {
      //console.log("if its working")
      return true;
    }
  } return false;
};

const urlsForUser = function(id, urlDatabase) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
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
}  
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
  if (cookieHasUser(req.cookies.user_id, users)) {
    let templateVars = {
      user: users[req.cookies.user_id],
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

/********************************************************************************************************** */

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies.user_id, urlDatabase),
    user: users[req.cookies.user_id],
  };
  res.render("urls_index", templateVars);
});


app.post("/urls", (req, res) => {
  console.log(req.cookies.user_id);
  if (req.cookies.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies.user_id,
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
      user: users[req.cookies.user_id],
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
  const userID = req.cookies.user_id;
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
  if (cookieHasUser(req.cookies.user_id, users)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.cookies.user_id],
    };
    res.render("urls_login", templateVars);
  }
});

app.post('/login', (req, res) => { 
  if (!emailLookUp(req.body.email, users)) {

    res.status(403).send('Invalid request');

  } else if (!req.body.email || !req.body.password) {

    res.redirect(403, '/login');
  } else {
    const user = findUserByEmail(req.body.email, users);
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.password, salt);
    console.log('this is hash', hash);
    console.log('this is salt', salt);
    if (bcrypt.compareSync(req.body.password, hash)) {
      res.cookie("user_id" , user.id);
      res.redirect('/urls');
    } else {
      res.status(403).send('The user name/password is incorrect');
    }
  }
});

/********************************************************************************************************** */

app.post('/logout', (req, res) => {
  //req.session['user_id'] = null;
  res.clearCookie('user_id');
  res.redirect('/urls');
})

/********************************************************************************************************** */

app.get('/register', (req, res) => {
  if (cookieHasUser(req.cookies.user_id, users)) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      user: users[req.cookies.user_id],
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

  res.cookie("user_id", newUserID);
  res.redirect('/urls');
    }
});

/********************************************************************************************************** */

app.post("/urls/:id", (req, res) => {
  const userID = req.cookies.user_id;
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
