//helper functions
const generateRandomString = function() {
  return Math.random().toString(36).replace('0.', '').substring(0, 6);
};
const checkPrefixes = function(url) {
  //make sure http and/or www prefixes are present
  let fixedURL = url;

  if (!url.includes('http://') && !url.includes('https://'))
    fixedURL = 'http://' + fixedURL;
  
  return fixedURL;
};
const checkEmailExist = function(allUsers, email) {
  for (let [user, userData] of Object.entries(allUsers)) {
    if (userData['email'] === email)
      return user;
  }
  return undefined;
};
const getUserURLS = function(urls, user) {
  const filteredURLS = {};
  for (let [key, value] of Object.entries(urls)) {
    if (user === value['userID'])
      filteredURLS[key] = value;
  }
  return filteredURLS;
};

module.exports = { generateRandomString, checkPrefixes, checkEmailExist, getUserURLS };