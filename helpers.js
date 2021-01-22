//Check in the users if this email exists
const emailLookUp = function(email,users) {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

//Get a user by their email
const getUserByEmail = function(email,users) {
  for (user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

//Check if a cookie is equal to a user in our Database
const cookieHasUser = function(cookie, userDatabase) {
  for (const user in userDatabase) {
    if (cookie === user) {
      return true;
    }
  } return false;
};

//Check what urls a specific user has
const urlsForUser = function(id, urlDatabase) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

module.exports = {emailLookUp, getUserByEmail, cookieHasUser, urlsForUser};