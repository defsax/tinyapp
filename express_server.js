const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

const generateRandomString = function() {
  return Math.random().toString(36).replace('0.', '').substring(0, 6);
};
const checkPrefixes = function(url) {
  //make sure http and www prefixes are present
  let fixedURL = '';
  if (!url.includes('www.')) {
    fixedURL += 'www.' + url;
  }
  if (!url.includes('http://'))
    fixedURL = 'http://' + fixedURL;
  
  return fixedURL;
};

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (request, response) => {
  response.render('index');
});

app.get('/urls', (request, response) => {
  const templateVars = { urls: urlDatabase };
  response.render('urls_index', templateVars);
});

app.post('/urls', (request, response) => {
  let short = generateRandomString();
  let long = checkPrefixes(request.body['longURL']);

  urlDatabase[short] = long;
  console.log('\nURL Database:\n', urlDatabase);
  response.redirect(`/urls/${short}`);
});

app.get('/urls/new', (request, response) => {
  response.render('urls_new');
});

app.get('/urls/:shortURL', (request, response) => {
  if (urlDatabase[request.params.shortURL] === undefined) {
    console.log('Short url doesn\'t exist...');
    //redirect to 404
    response.redirect('/404');
  } else {
    const templateVars = { shortURL: request.params.shortURL, longURL: urlDatabase[request.params.shortURL]};
    response.render('urls_show', templateVars);
  }
});

app.get('/u/:shortURL', (request, response) => {
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

app.get('*', (request, response) => {
  response.render('404');
});

app.get('/404', (request, response) => {
  response.render('404');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
