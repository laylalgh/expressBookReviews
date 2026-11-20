const express = require('express');
const axios = require('axios');
const books = require('./booksdb');
const { register } = require('./auth_users');
const general = express.Router();

general.post('/register', register);
general.get('/', (req, res) => res.json(books));

function findBook(req, res, next) {
  if (!Object.hasOwn(books, req.params.isbn)) {
    return res.status(404).json({ message: 'Book not found' });
  }
  req.book = books[req.params.isbn];
  next();
}
general.get('/isbn/:isbn', findBook, (req, res) => res.json(req.book));
general.get('/review/:isbn', findBook, (req, res) => res.json(req.book.reviews));

for (const field of ['author', 'title']) {
  general.get('/' + field + '/:value', (req, res) => {
    const value = req.params.value.toLowerCase();
    const matches = Object.entries(books).filter(([, book]) => book[field].toLowerCase() === value);
    res.json(Object.fromEntries(matches));
  });
}

// Asynchronous clients for the four public catalog routes.
const api = axios.create({ baseURL: 'http://127.0.0.1:5000', timeout: 5000 });
async function getAllBooks() { return (await api.get('/')).data; }
async function getByISBN(isbn) { return (await api.get('/isbn/' + encodeURIComponent(isbn))).data; }
async function getByAuthor(author) { return (await api.get('/author/' + encodeURIComponent(author))).data; }
async function getByTitle(title) { return (await api.get('/title/' + encodeURIComponent(title))).data; }

module.exports = { general, getAllBooks, getByISBN, getByAuthor, getByTitle };
