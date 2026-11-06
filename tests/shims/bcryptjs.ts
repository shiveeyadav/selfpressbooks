// TEST-ONLY stand-in for bcryptjs (scrypt-based); the app uses real bcryptjs.
import crypto from 'node:crypto';
const h = (p: string, salt = crypto.randomBytes(8).toString('hex')) => `${salt}$${crypto.scryptSync(p, salt, 32).toString('hex')}`;
export default {
  hashSync: (p: string) => h(p),
  hash: async (p: string) => h(p),
  compare: async (p: string, stored: string) => h(p, stored.split('$')[0]) === stored,
};
