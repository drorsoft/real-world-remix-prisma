import bcrypt from 'bcryptjs'
import { db } from './db.server'
import { commitSession, destroySession, getSession } from './session.server'
import type { Prisma, User } from '@prisma/client'
import { redirect } from '@remix-run/node'
import {
  nonEmptyStringSchema,
  userEmailSchema,
  userNameSchema,
  userPasswordSchema,
  validate,
} from './validation.server'
import { z } from 'zod'
import { redirectHome, redirectToLogin } from './http.server'

export class AuthenticationError extends Error {
  constructor(
    public errors: Record<string, string[] | undefined>,
    public message: string = ''
  ) {
    super(message)
  }
}

export async function authenticate(
  email: FormDataEntryValue | null,
  password: FormDataEntryValue | null
) {
  const LoginUserSchema = z.object({
    email: userEmailSchema,
    password: userPasswordSchema,
  })

  const validated = await validate({ email, password }, LoginUserSchema)

  const user = await db.user.findFirst({ where: { email: validated.email } })

  if (!user) {
    throw new AuthenticationError({
      'email or password': ['is invalid'],
    })
  }

  const match = await bcrypt.compare(validated.password, user.password)

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

export async function createUser({
  name,
  email,
  password,
}: {
  name: FormDataEntryValue | null
  email: FormDataEntryValue | null
  password: FormDataEntryValue | null
}) {
  const CreateUserSchema = z.object({
    password: userPasswordSchema.and(nonEmptyStringSchema),
    email: userEmailSchema,
    name: userNameSchema,
  })

  const validated = await validate(
    {
      name,
      email,
      password,
    },
    CreateUserSchema
  )

  return db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      password: validated.password,
    },
  })
}

export async function currentUser<T extends Prisma.UserSelectScalar>(
  request: Request,
  select?: T
) {
  const userId = await currentUserId(request)

  if (!userId) return null

  return db.user.findUnique({
    where: { id: userId },
    select,
  })
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

  if (!userId) throw redirectToLogin()

  return userId
}

export async function logout(request: Request) {
  const session = await getSession(request)

  return redirectHome({
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  })
}
