import type { ActionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { destroySession, getSession } from '~/lib/session.server'

export async function action({ request }: ActionArgs) {
  const session = await getSession(request)

  return redirect('/', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  })
}
