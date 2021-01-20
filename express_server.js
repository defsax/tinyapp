const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
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



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.duckduckgo.com"
};

//homepage view
app.get('/', (request, response) => {
  response.render('index', { username: request.cookies['username'] });
});

//login and store cookie
app.post('/login', (request, response) => {
  response.cookie('username', request.body['username']);
  response.redirect('/urls');
});

//logout and clear cookie
app.post('/logout', (request, response) => {
  response.clearCookie('username');
  response.redirect('/urls');
});

//url list view. pass all urls in templatevars for listing
app.get('/urls', (request, response) => {
  const templateVars = {
    urls: urlDatabase,
    username: request.cookies['username']
  };

  response.render('urls_index', templateVars);
});

//create a new randomID and add short/long urls to 'database'
app.post('/urls', (request, response) => {
  let short = generateRandomString();
  let long = checkPrefixes(request.body['longURL']);

  urlDatabase[short] = long;
  console.log('\nURL Database:\n', urlDatabase);
  response.redirect(`/urls/${short}`);
});

//view when we create a new short url
app.get('/urls/new', (request, response) => {
  response.render('urls_new', { username: request.cookies['username'] });
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
      longURL: urlDatabase[request.params.shortURL],
      username: request.cookies['username']
    };

    response.render('urls_show', templateVars);
  }
});

//create a new short url and redirect to /urls/:shortURL
app.post('/urls/:shortURL', (request, response) => {
  urlDatabase[request.params.shortURL] = checkPrefixes(request.body['longURL']);
  console.log(urlDatabase);
  response.redirect(`/urls/${request.params.shortURL}`);
});

app.get('/register', (request, response)  => {
  response.render('register', {username: request.cookies['username']});
});

app.post('/register', (request, response) => {
  console.log(request.body);
  response.redirect('/urls');
});

//short url redirect to actual longurl site
app.get('/u/:shortURL', (request, response) => {
  //check if shorturl exists first
  if (urlDatabase[request.params.shortURL] === undefined) {
    console.log('Short url doesn\'t exist...');
    //redirect to 404
    response.redirect('/404');
  } else {
    const longURL = urlDatabase[request.params.shortURL];
    console.log(longURL);
    response.redirect(longURL);
  }
});

//delete a shortURL from the urlDatabase and redirect to /urls
app.post('/urls/:shortURL/delete', (request, response) => {
  let shortURL = request.params.shortURL;
  delete urlDatabase[shortURL];
  response.redirect('/urls');
});

//anything that is not defined on the server is a 404
app.get('*', (request, response) => {
  response.render('404', { username: request.cookies['username'] });
});

//404 page view
app.get('/404', (request, response) => {
  response.render('404', { username: request.cookies['username'] });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
