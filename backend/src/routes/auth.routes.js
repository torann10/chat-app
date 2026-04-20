import {Router} from 'express';
import passport from 'passport';
import bcrypt from 'bcrypt';
import prisma from '../database/prisma.js';
import {generateToken} from '../services/auth.service.js';
import {validateBody} from '../middleware/validate.js';
import {SignupSchema, LoginSchema} from 'shared';

const router = Router();

router.post('/signup', validateBody(SignupSchema), async (req, res) => {
  const {email, password, fullname} = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {email, passwordHash, ...(fullname ? {fullname} : {})},
    });
    const token = generateToken(user);
    res.json({token, message: 'User created successfully'});
  } catch {
    res.status(400).json({error: 'Email already exists or invalid data'});
  }
});

router.post(
  '/login',
  validateBody(LoginSchema),
  passport.authenticate('local', {session: false}),
  (req, res) => {
    res.json({token: generateToken(req.user)});
  },
);

router.get('/google', passport.authenticate('google', {scope: ['profile', 'email'], session: false}));

router.get(
  '/google/callback',
  passport.authenticate('google', {session: false, failureRedirect: `${process.env.FRONTEND_URL}/login`}),
  (req, res) => res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${generateToken(req.user)}`),
);

router.get('/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile'], session: false}));

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {session: false, failureRedirect: `${process.env.FRONTEND_URL}/login`}),
  (req, res) => res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${generateToken(req.user)}`),
);

export default router;