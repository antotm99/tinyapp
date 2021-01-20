const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

app.set("view engine", "ejs");

// userDatabase = {username as key:{name and email and password}} 

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

const emailLookUp = function (email,users) {
  for (user in users) {
    if (users[user].email === email) {
      return true 
    }
  } 
  return false
 };

  const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
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
  const templateVars = { username: req.body["username"] };
  res.render("urls_new", templateVars);
});
/********************************************************************************************************** */
app.get("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});
/********************************************************************************************************** */
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.body["username"]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  delete urlDatabase[urlToDelete];
  res.redirect("/urls");
});

app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => { 
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.get('/register', (req, res) => {
  res.render('urls_register');
})

app.post('/register', (req, res) => {
if (emailLookUp(req.body.email)) {
    res.redirect(400, '/register');
  } else if (!req.body.email) {
    res.redirect(400, '/register');
  } else if (!req.body.password) {
    res.redirect(400, '/register');
  } else {
    const userId = generateRandomString();
      users[userId] = {
        id: userId,
        email: req.body.email,
        password: req.body.password
      };
  res.cookie("user_id", userId);
  res.redirect('/urls');
    }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
 });
