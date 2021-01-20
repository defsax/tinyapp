const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());
app.use(morgan('dev'));

//helper functions
const generateRandomString = function() {
  return Math.random().toString(36).replace('0.', '').substring(0, 6);
};
const checkPrefixes = function(url) {
  //make sure http and www prefixes are present
  let fixedURL = url;
  if (!url.includes('www.') && !url.includes('http://')) {
    fixedURL = 'www.' + fixedURL;
  }
  if (!url.includes('http://'))
    fixedURL = 'http://' + fixedURL;
  
  return fixedURL;
};
const checkEmailExist = function(allUsers, email) {
  for (let [user, userData] of Object.entries(allUsers)) {
    if (userData['email'] === email)
      return user;
  }
  return false;
};
const getUserURLS = function(urls, user) {
  const filteredURLS = {};
  for (let [key, value] of Object.entries(urls)) {
    if (user === value['userID'])
      filteredURLS[key] = value;
  }
  return filteredURLS;
};
const isUserURL =  function(url, user) {
  console.log('url:', url);
  console.log('user:', user);
  if (urlDatabase[url]['userID'] === user)
    return true;
  return false;
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
  },
  '123ID': {
    id: '123ID',
    email: '123@123.com',
    password: '123'
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "123ID"
  },
  "9sm5xK": {
    longURL: "http://www.duckduckgo.com",
    userID: "userRandomID"
  }
};

//homepage view
app.get('/', (request, response) => {
  response.render('index', { user: users[request.cookies['user_id']] });
});

//url list view. pass user's urls in templatevars for listing
app.get('/urls', (request, response) => {
  //get only urls specific to user
  const userURLS = getUserURLS(urlDatabase, request.cookies['user_id']);

  const templateVars = {
    urls: userURLS,
    user: users[request.cookies['user_id']]
  };
  response.render('urls_index', templateVars);
});

//create a new randomID and add short/long urls to 'database'
app.post('/urls', (request, response) => {
  let shortURL = generateRandomString();
  let longURL = checkPrefixes(request.body['longURL']);

  urlDatabase[shortURL] = { longURL, userID: users[request.cookies['user_id']]['id'] };
  console.log('\nURL Database:\n', urlDatabase);
  response.redirect(`/urls/${shortURL}`);
});

//view when we create a new short url
app.get('/urls/new', (request, response) => {
  //if user_id cookie is undefined, user is not logged in
  if (!request.cookies['user_id']) {
    response.redirect('/urls');
  } else {
    response.render('urls_new', { user: users[request.cookies['user_id']] });
  }
});

//view for specific long and short url & longurl edit form
app.get('/urls/:shortURL', (request, response) => {
  //check if shorturl exists first
  if (urlDatabase[request.params.shortURL] === undefined) {
    console.log('Url doesn\'t exist...');
    //redirect to 404
    response.redirect('/404');
  } else {
    const templateVars = {
      shortURL: request.params.shortURL,
      longURL: urlDatabase[request.params.shortURL]['longURL'],
      user: users[request.cookies['user_id']]
    };

    response.render('urls_show', templateVars);
  }
});

//edit a long url and redirect to corresponding /urls/:shortURL
app.post('/urls/:shortURL', (request, response) => {
  //console.log(request.params.shortURL);
  if (isUserURL(request.params.shortURL, request.cookies['user_id'])) {
    urlDatabase[request.params.shortURL]['longURL'] = checkPrefixes(request.body['longURL']);
    console.log(urlDatabase);
    response.redirect(`/urls/${request.params.shortURL}`);
  } else {
    response.status(401).send('Access denied.');
  }
});

//login view
app.get('/login', (request, response) => {
  response.render('login', { user: users[request.cookies['user_id']] });
});

//login and store cookie
app.post('/login', (request, response) => {
  //look up user by email
  let user = checkEmailExist(users, request.body['email']);

  //if user has a value, that user is in the database
  if (user) {
    //check if passwords match
    //if (users[user]['password'] === request.body['password'])
    if (bcrypt.compareSync(request.body['password'], users[user]['hashedPassword'])) {
      response.cookie('user_id', users[user]['id']);
      response.redirect('/urls');
    } else {
      response.status(403).send('Invalid password!');

    }
  } else {
    //if email is invalid
    response.status(403).send('User isn\'t registered!');
  }
});

//logout and clear cookie
app.post('/logout', (request, response) => {
  response.clearCookie('user_id');
  response.redirect('/login');
});

app.get('/register', (request, response)  => {
  response.render('register', { user: users[request.cookies['user_id']] });
});

app.post('/register', (request, response) => {
  //check for empty strings
  if (!request.body['email'] || !request.body['password']) {
    response.status(400).send('No email or password entered!');
    
  //check if new email already exists in database
  } else if (checkEmailExist(users, request.body['email']) !== false) {
    response.status(400).send('Email already registered!');
  } else {
    
    //create new user in user database
    let id = generateRandomString();
    let email = request.body['email'];
    const hashedPassword = bcrypt.hashSync(request.body['password'], 10);

    users[id] = { id, email, hashedPassword };
    console.log('Users:', users);

    response.cookie('user_id', id);
    response.redirect('/urls');
  }
});

//short url redirect to actual longurl site
app.get('/u/:shortURL', (request, response) => {
  console.log(request.params.shortURL);
  //check if shorturl exists first
  if (urlDatabase[request.params.shortURL] === undefined) {
    console.log('Short url doesn\'t exist...');
    //redirect to 404
    response.redirect('/404');
  } else {
    const longURL = urlDatabase[request.params.shortURL]['longURL'];
    console.log(longURL);
    response.redirect(longURL);
  }
});

//delete a shortURL from the urlDatabase and redirect to /urls
app.post('/urls/:shortURL/delete', (request, response) => {
  if (isUserURL(request.params.shortURL, request.cookies['user_id'])) {
    let shortURL = request.params.shortURL;
    delete urlDatabase[shortURL];
    response.redirect('/urls');
  } else {
    response.status(401).send('Access denied.');
  }
});

//anything that is not defined on the server is a 404
app.get('*', (request, response) => {
  response.render('404', { user: users[request.cookies['user_id']] });
});

//404 page view
app.get('/404', (request, response) => {
  response.render('404', { user: users[request.cookies['user_id']] });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
