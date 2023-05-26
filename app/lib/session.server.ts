import { createCookieSessionStorage } from '@remix-run/node'

type SessionData = {
  userId: number
}

type SessionFlashData = {
  error: string
  success: string
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: 'real_world_remix_session',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 1000 * 7,
      path: '/',
      sameSite: 'lax',
      secrets: [process.env.SESSION_SECRET],
      secure: true,
    },
  })

export { getSession, commitSession, destroySession }
