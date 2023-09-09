import { redirect } from '@remix-run/node'
import { getSession } from './session.server'

export async function requireUserId(request: Request) {
  const session = await getSession(request)

  const userId = session.get('userId')

  const url = new URL(request.url)

  const searchParams = new URLSearchParams({ next: url.pathname })

  if (!userId) {
    throw redirect(`/login?${searchParams.toString()}`)
  }

  return userId
}
