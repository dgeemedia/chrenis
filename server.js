// server.js
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts'); // <- add this
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');

const config = require('./config');
const routes = require('./routes'); // routes/indexRoutes.js
const errorHandler = require('./middlewares/errorHandler');
const swagger = require('./swagger');
const db = require('./db/connect');

const app = express();
const PORT = process.env.PORT || config.PORT || 3000;

(async () => {
  try {
    // Initialize native MongoDB connection first
    await db.initDb();

    // load passport strategies AFTER db.initDb so passport can access db
    require('./auth/passport-github');

    // basic middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('dev'));
    app.use(rateLimit({ windowMs: 60_000, max: 120 }));

    // views & static
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    // express-ejs-layouts setup (default layout)
    app.use(expressLayouts);
    app.set('layout', 'layouts/layout'); // uses views/layouts/layout.ejs by default

    // serve static files (public)
    app.use(express.static(path.join(__dirname, 'public')));

    // session store (connect-mongo using the same MONGODB_URI)
    app.use(session({
      secret: process.env.SESSION_SECRET || 'replace_this_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
      }),
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
    }));

    // passport
    app.use(passport.initialize());
    app.use(passport.session());

    // make user and flash available to all views
    app.use((req, res, next) => {
      res.locals.user = req.user || null;
      // simple flash support stored in session: req.session.flash = { success, error }
      res.locals.flash = (req.session && req.session.flash) ? req.session.flash : null;
      // clear one-time flash after exposing it
      if (req.session && req.session.flash) delete req.session.flash;
      next();
    });

    // mount routes
    app.use('/api', routes);
    app.use('/api-docs', swagger.serve, swagger.setup);

    // simple view routes
    app.get('/', (req, res) => res.render('index')); // layout applied automatically
    app.get('/user/dashboard', (req, res) => res.render('user/dashboard'));
    app.get('/admin/dashboard', (req, res) => res.render('admin/dashboard'));

    // health
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    // error handler
    app.use(errorHandler);

    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();

module.exports = app;
