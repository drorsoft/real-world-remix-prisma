import { redirect } from '@remix-run/node'
import { getSession } from './session.server'
import { LOGIN_URL } from '~/settings'

export async function requireLogin(request: Request) {
  const session = await getSession(request)

  const userId = session.get('userId')

  const url = new URL(request.url)

  const searchParams = new URLSearchParams({ next: url.pathname })

  if (!userId) {
    throw redirect(`${LOGIN_URL}?${searchParams.toString()}`)
  }

  return userId
}

export const currentUserId = requireLogin
