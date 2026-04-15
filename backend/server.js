import express from 'express';
import db, { initDb } from './src/database/db.js';
import { JWT_SECRET, generateToken } from './src/services/auth.service.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import passport from 'passport';
import passportLocal from 'passport-local';
import passportGoogle from 'passport-google-oauth20';
import passportFacebook from 'passport-facebook';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const LocalStrategy = passportLocal.Strategy;
const GoogleStrategy = passportGoogle.Strategy;
const FacebookStrategy = passportFacebook.Strategy;

const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

const FRONTEND_URL = process.env.FRONTEND_URL;
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID; 
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

initDb();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token && socket.handshake.headers['authorization']) {
    token = socket.handshake.headers['authorization'].split(' ')[1];
  }

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    
    socket.user = decodedUser; 
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('send_message', (data) => {
    console.log('Message received:', data);
    
    socket.broadcast.emit('receive_message', data); 
    
    // io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  try {
    const stmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
    const user = stmt.get(email);

    if (!user || !user.password_hash) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) return done(err);
      if (isMatch) return done(null, user);
      return done(null, false, { message: 'Invalid credentials' });
    });
  } catch (err) {
    return done(err);
  }
}));

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;

      const stmt = db.prepare(`SELECT * FROM users WHERE google_id = ? OR email = ?`);
      const user = stmt.get(googleId, email);

      if (user) {
        if (!user.google_id) {
            const updateStmt = db.prepare(`UPDATE users SET google_id = ? WHERE id = ?`);
            updateStmt.run(googleId, user.id);
        }
        return done(null, user);
      } else {
        const insertStmt = db.prepare(`INSERT INTO users (email, google_id) VALUES (?, ?)`);
        const result = insertStmt.run(email, googleId);

        return done(null, { id: result.lastInsertRowid, email: email, google_id: googleId });
      }
    } catch (err) {
      return done(err);
    }
  }
));

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_CLIENT_ID,
    clientSecret: FACEBOOK_CLIENT_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'emails'] 
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails ? profile.emails[0].value : null;
      const facebookId = profile.id;
      
      const stmt = db.prepare(`SELECT * FROM users WHERE facebook_id = ? OR email = ?`);
      const user = stmt.get(facebookId, email);

      if (user) {
        if (!user.facebook_id && email) {
            const updateStmt = db.prepare(`UPDATE users SET facebook_id = ? WHERE id = ?`);
            updateStmt.run(facebookId, user.id);
        }
        return done(null, user);
      } else {
        const insertStmt = db.prepare(`INSERT INTO users (email, facebook_id) VALUES (?, ?)`);
        const result = insertStmt.run(email, facebookId);

        return done(null, { id: result.lastInsertRowid, email: email, facebook_id: facebookId });
      }
    } catch (err) {
      return done(err);
    }
  }
));

app.post('/auth/signup', async (req, res) => {
  console.log("INCOMING DATA FROM POSTMAN:", req.body);
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`INSERT INTO users (email, password_hash) VALUES (?, ?)`);
    const result = stmt.run(email, hashedPassword);
    
    const token = generateToken({ id: result.lastInsertRowid, email });
    res.json({ token, message: 'User created successfully' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Email already exists or invalid data" });
  }
});

app.post('/auth/login', passport.authenticate('local', { session: false }), (req, res) => {
  const token = generateToken(req.user);
  res.json({ token });
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

app.get('/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login` }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`${FRONTEND_URL}/auth-callback?token=${token}`);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: `${FRONTEND_URL}/login` }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`${FRONTEND_URL}/auth-callback?token=${token}`);
});

httpServer.listen(3000, () => {
  console.log('Socket.IO server running on http://localhost:3000');
});