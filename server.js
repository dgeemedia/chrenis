// server.js (full, updated)
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');

const config = require('./config');
const routes = require('./routes'); // api routes (index.js -> indexRoutes)
const errorHandler = require('./middlewares/errorHandler');
const swagger = require('./swagger');
const db = require('./db/connect');

const app = express();
const PORT = process.env.PORT || config.PORT || 5000;

(async () => {
  try {
    // init DB
    await db.initDb();

    // passport strategies (depends on db)
    require('./auth/passport-github');

    // security + body parsers + logging
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('dev'));
    app.use(rateLimit({ windowMs: 60_000, max: 120 }));

    app.use(cookieParser());

    // views & static
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    // layouts
    app.use(expressLayouts);
    app.set('layout', 'layouts/layout');

    app.use(express.static(path.join(__dirname, 'public')));

    // sessions
    app.use(session({
      secret: process.env.SESSION_SECRET || 'replace_this_secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || config.MONGODB_URI,
        collectionName: 'sessions'
      }),
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
    }));

    // passport
    app.use(passport.initialize());
    app.use(passport.session());

    // locals middleware (user, flash, title, meta)
    app.use((req, res, next) => {
      res.locals.user = req.user || null;
      res.locals.flash = (req.session && req.session.flash) ? req.session.flash : null;
      if (req.session && req.session.flash) delete req.session.flash;
      res.locals.title = (typeof res.locals.title !== 'undefined') ? res.locals.title : 'Chrenis';
      res.locals.meta = (typeof res.locals.meta !== 'undefined') ? res.locals.meta : {};
      next();
    });
servers: [{ url: 'http://localhost:5000/api' }]

    // ---- Mount auth at top-level so /auth/start-oauth and /auth/github work ----
    app.use('/auth', require('./routes/auth'));

    // ---- Mount UI routes BEFORE API routes so user-facing pages are available ----
    app.use('/', require('./routes/uiRoutes'));

    // ---- Mount API (JSON) routes under /api ----
    app.use('/api', routes);

    // Swagger UI (docs)
    app.use('/api-docs', swagger.serve, swagger.setup);

    // legacy simple view routes (optional — UI routes handle these)
    // app.get('/', (req, res) => res.render('index'));
    // app.get('/user/dashboard', (req, res) => res.render('user/dashboard'));

    // health
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    // error handler (last)
    app.use(errorHandler);

    const server = app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

    // graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down...`);
      try {
        if (server) await new Promise(r => server.close(r));
        const client = db.getClient && db.getClient();
        if (client && client.close) await client.close();
        process.exit(0);
      } catch (err) {
        console.error('Shutdown error', err);
        process.exit(1);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (r, p) => console.error('Unhandled Rejection', r, p));

  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();

module.exports = app;
