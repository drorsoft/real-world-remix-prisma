import { redirect } from '@remix-run/node'
import { getSession } from './session.server'
import { LOGIN_URL } from '~/settings'

export async function requireLogin(request: Request) {
  const userId = await currentUserId(request)

  const url = new URL(request.url)

  const searchParams = new URLSearchParams({ next: url.pathname })

  if (!userId) {
    throw redirect(`${LOGIN_URL}?${searchParams.toString()}`)
  }

  return userId
}

export const requireUserId = requireLogin

export async function currentUserId(request: Request) {
  const session = await getSession(request)

  return session.get('userId')
}
