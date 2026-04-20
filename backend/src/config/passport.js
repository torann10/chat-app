import passportLocal from 'passport-local';
import passportGoogle from 'passport-google-oauth20';
import passportFacebook from 'passport-facebook';
import bcrypt from 'bcrypt';
import prisma from '../database/prisma.js';

const LocalStrategy = passportLocal.Strategy;
const GoogleStrategy = passportGoogle.Strategy;
const FacebookStrategy = passportFacebook.Strategy;

export function configurePassport(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        return isMatch
          ? done(null, user)
          : done(null, false, { message: 'Invalid credentials' });
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
          const fullname = profile.displayName;

          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId }, { email }] },
          });

          if (user) {
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId, fullname },
              });
            }
            return done(null, user);
          }

          user = await prisma.user.create({ data: { email, googleId, fullname } });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'emails', 'displayName'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? null;
          const facebookId = profile.id;
          const fullname = profile.displayName;

          let user = await prisma.user.findFirst({
            where: { OR: [{ facebookId }, ...(email ? [{ email }] : [])] },
          });

          if (user) {
            if (!user.facebookId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { facebookId, fullname },
              });
            }
            return done(null, user);
          }

          user = await prisma.user.create({ data: { email, facebookId, fullname } });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}