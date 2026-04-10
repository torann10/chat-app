import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email }, 
    JWT_SECRET, 
    { expiresIn: '1d' }
  );
}