const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use('/customer', session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false
}), require('./router/auth_users').authenticated);
app.use('/', require('./router/general').general);
app.listen(5000, () => console.log('Bookshop listening on port 5000'));
