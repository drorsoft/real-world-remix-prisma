import bcrypt from 'bcryptjs'
import { db } from './db.server'
import { commitSession, destroySession, getSession } from './session.server'
import type { User } from '@prisma/client'
import { redirect } from '@remix-run/node'

export const LOGIN_URL = '/login'

export class AuthenticationError extends Error {
  constructor(
    public errors: Record<string, string[] | undefined>,
    public message: string = ''
  ) {
    super(message)
  }
}

export async function authenticate(username: string, password: string) {
  const user = await db.user.findFirst({ where: { email: username } })

  if (!user) {
    throw new AuthenticationError({
      'email or password': ['is invalid'],
    })
  }

  const match = await bcrypt.compare(password, user.password)

  if (!match) {
    throw new AuthenticationError({
      'email or password': ['is invalid'],
    })
  }

  return user
}

export async function currentUserId(request: Request) {
  const session = await getSession(request)

  const userId = session.get('userId')

  if (!userId) return null

  return userId
}

export async function currentUser(request: Request) {
  const userId = await currentUserId(request)

  if (!userId) return null

  const user = await db.user.findUnique({ where: { id: userId } })

  return user
}

export async function login({
  request,
  user,
  successMessage = 'Successful login!',
  redirectUrl = '/',
}: {
  request: Request
  user: User
  successMessage?: string
  redirectUrl?: string
}) {
  const session = await getSession(request)

  session.set('userId', user.id)

  session.flash('success', successMessage)

  return redirect(redirectUrl, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  })
}

export async function requireLogin(request: Request) {
  const userId = await currentUserId(request)

  if (!userId) throw redirect(LOGIN_URL)

  return userId
}

export async function logout(request: Request) {
  const session = await getSession(request)

  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  })
}
