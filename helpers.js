const emailLookUp = function(email,users) {
  for (user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

const getUserByEmail = function(email,users) {
  for (user in users) {
    if (users[user].email === email) {
      return users[user];
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

module.exports = {emailLookUp, getUserByEmail, cookieHasUser, urlsForUser};