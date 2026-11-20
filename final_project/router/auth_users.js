const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const books = require('./booksdb');
const authenticated = express.Router();
const users = new Map();
const secret = crypto.randomBytes(32);

function register(req, res) {
  const { username, password } = req.body;
  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (users.has(username)) return res.status(409).json({ message: 'Username already exists' });
  const salt = crypto.randomBytes(16);
  users.set(username, { salt, hash: crypto.scryptSync(password, salt, 32) });
  res.status(201).json({ message: 'User successfully registered' });
}
authenticated.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.get(username);
  if (!user || typeof password !== 'string' || !crypto.timingSafeEqual(user.hash, crypto.scryptSync(password, user.salt, 32))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  req.session.token = jwt.sign({ sub: username }, secret, { expiresIn: '1h' });
  res.json({ message: 'Successfully logged in' });
});
authenticated.use('/auth/review/:isbn', (req, res, next) => {
  try { req.username = jwt.verify(req.session.token, secret).sub; }
  catch { return res.status(401).json({ message: 'Please log in' }); }
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found' });
  req.reviews = books[req.params.isbn].reviews;
  next();
});
authenticated.put('/auth/review/:isbn', (req, res) => {
  const review = req.query.review;
  if (typeof review !== 'string' || !review.trim()) return res.status(400).json({ message: 'Review is required' });
  Object.defineProperty(req.reviews, req.username, { value: review, enumerable: true, configurable: true, writable: true });
  res.json({ message: 'Review saved', reviews: req.reviews });
});
authenticated.delete('/auth/review/:isbn', (req, res) => {
  if (!Object.hasOwn(req.reviews, req.username)) return res.status(404).json({ message: 'Review not found' });
  delete req.reviews[req.username];
  res.json({ message: 'Review deleted', reviews: req.reviews });
});
module.exports = { authenticated, register };
