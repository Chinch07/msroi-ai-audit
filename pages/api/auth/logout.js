import { sessionCookieHeader, getSession, ROLE } from '../../../lib/auth';

export default function handler(req, res) {
  // Read the role before clearing, so a member lands back on the members
  // sign-in page rather than on the staff one they can't use.
  const session = getSession(req);
  const destination = session?.role === ROLE.MEMBER ? '/members-login' : '/login';
  res.setHeader('Set-Cookie', sessionCookieHeader('', req, { clear: true }));
  res.writeHead(302, { Location: destination });
  res.end();
}
