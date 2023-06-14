import { createCookieSessionStorage } from '@remix-run/node'

export type SessionData = {
  userId: number
}

export type SessionFlashData = {
  error: string
  success: string
}

const sessionStorage = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
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

export function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get('Cookie'))
}

export const commitSession = sessionStorage.commitSession
export const destroySession = sessionStorage.destroySession
