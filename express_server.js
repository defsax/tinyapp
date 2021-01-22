const express = require('express');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');

const { generateRandomString, checkPrefixes, checkEmailExist, getUserURLS } = require('./helpers');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  secret: 'purple-funky-dinosaur'
}));
app.use(methodOverride('_method'));

//custom middleware to clean up database calls
app.use((request, response, next) => {

  const user = users[request.session['user_id']];
  request.currentUser = user;

  next();
});

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
    userID: "123ID",
    analytics: {
      visits: 0,
      uVisits: 0,
      visitList: []
    }
  },
  "9sm5xK": {
    longURL: "http://www.duckduckgo.com",
    userID: "userRandomID",
    analytics: {
      visits: 0,
      uVisits: 0,
      visitList: []
    }
  }
};

//homepage view
app.get('/', (request, response) => {
  response.render('index', { user: request.currentUser });
});

//url list view. pass user's urls in templatevars for listing
app.get('/urls', (request, response) => {
  //get only urls specific to user
  const userURLS = getUserURLS(urlDatabase, request.session['user_id']);

  const templateVars = {
    urls: userURLS,
    user: request.currentUser
  };
  response.render('urls_index', templateVars);
});

//create a new randomID and add short/long urls to 'database'
app.post('/urls', (request, response) => {
  let shortURL = generateRandomString();
  let longURL = checkPrefixes(request.body['longURL']);

  urlDatabase[shortURL] = { longURL, userID: request.currentUser['id'], analytics: { visits: 0, uVisits: 0, visitList: [] }};
  
  response.redirect(`/urls/${shortURL}`);
});

//view when we create a new short url
app.get('/urls/new', (request, response) => {
  //if user_id cookie in the database is undefined, user is not logged in. redirect to urls
  if (!request.currentUser) {
    response.redirect('/urls');
  } else {
    response.render('urls_new', { user: request.currentUser });
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
    //make sure user is signed in
    if (request.currentUser) {

      //url exists, now check that url owner belongs to requesting user
      const urlOwnerID = urlDatabase[request.params.shortURL]['userID'];

      if (urlOwnerID === request.currentUser['id']) {

        //create and pass appropriate information to template
        const templateVars = {
          user: request.currentUser,
          shortURL: request.params.shortURL,
          longURL: urlDatabase[request.params.shortURL]['longURL'],
          visits: urlDatabase[request.params.shortURL]['analytics']['visits'],
          uVisits: urlDatabase[request.params.shortURL]['analytics']['uVisits'],
          visitList: urlDatabase[request.params.shortURL]['analytics']['visitList']
        };

        response.render('urls_show', templateVars);
      } else {
        response.status(401).send('Access denied.');
      }
    } else {
      response.redirect('/urls');
    }
  }
});

//edit a long url and redirect to corresponding /urls/:shortURL
app.put('/urls/:shortURL', (request, response) => {
  //check that shortURL owner matches requesting userID
  const urlOwnerID = urlDatabase[request.params.shortURL]['userID'];

  if (urlOwnerID === request.currentUser['id']) {
    urlDatabase[request.params.shortURL]['longURL'] = checkPrefixes(request.body['longURL']);

    response.redirect(`/urls/${request.params.shortURL}`);
  } else {
    response.status(401).send('Access denied.');
  }
});

//login view
app.get('/login', (request, response) => {
  response.render('login', { user: request.currentUser });
});

//login user and store cookie
app.post('/login', (request, response) => {
  //look up user by email
  let user = checkEmailExist(users, request.body['email']);

  //if user has a value, that user is in the database
  if (user) {
    //check if passwords match

    if (bcrypt.compareSync(request.body['password'], users[user]['hashedPassword'])) {
      request.session['user_id'] = users[user]['id'];
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
  request.session['user_id'] = null;
  response.redirect('/login');
});

app.get('/register', (request, response)  => {
  response.render('register', { user: request.currentUser });
});

app.post('/register', (request, response) => {
  //check for empty strings
  if (!request.body['email'] || !request.body['password']) {
    response.status(400).send('No email or password entered!');
    
  //check if new email already exists in database
  } else if (checkEmailExist(users, request.body['email']) !== undefined) {
    // response.status(400).send('Email already registered!');
    response.status(400).send('Email already registered!');
  } else {
    
    //create new user in user database
    let id = generateRandomString();
    let email = request.body['email'];
    const hashedPassword = bcrypt.hashSync(request.body['password'], 10);

    users[id] = { id, email, hashedPassword };

    //set cookie and attached information
    request.session['user_id'] = id;
    response.redirect('/urls');
  }
});

//short url redirect to actual longurl site
app.get('/u/:shortURL', (request, response) => {

  //check if shorturl exists in the database first
  if (urlDatabase[request.params.shortURL] === undefined) {
    //redirect to 404
    response.redirect('/404');
  
  } else {
    //see if unique_visitor cookie property exists yet
    if (!request.session['unique_visitor']) {
      //if not, this is a unique visitor
      //create unique_visitor cooke key and assign it a random id
      request.session['unique_visitor'] = generateRandomString();
      urlDatabase[request.params.shortURL]['analytics']['uVisits']++;
    }

    //increase total visits even if unique_visitor
    urlDatabase[request.params.shortURL]['analytics']['visits']++;
    //add items in reverse order for display purposes
    urlDatabase[request.params.shortURL]['analytics']['visitList'].unshift({
      //id will be unique visitor id assigned automatically if this is a new visitor
      id: request.session['unique_visitor'],
      timeStamp: new Date()
    });
    
    //redirect
    const longURL = urlDatabase[request.params.shortURL]['longURL'];
    response.redirect(longURL);
  }
});

//delete a shortURL from the urlDatabase and redirect to /urls
app.delete('/urls/:shortURL', (request, response) => {
  //check that shortURL ownerID matches userID

  if (urlDatabase[request.params.shortURL]['userID'] === request.session['user_id']) {
    let shortURL = request.params.shortURL;
    delete urlDatabase[shortURL];
    
    response.redirect('/urls');
  } else {
    response.status(401).send('Access denied.');
  }
});

//anything that is not defined on the server is a 404
app.get('*', (request, response) => {
  response.render('404', { user: request.currentUser });
});

//404 page view
app.get('/404', (request, response) => {
  response.render('404', { user: request.currentUser });
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});