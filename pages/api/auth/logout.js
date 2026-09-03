import { sessionCookieHeader } from '../../../lib/auth';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', sessionCookieHeader('', req, { clear: true }));
  res.writeHead(302, { Location: '/login' });
  res.end();
}
