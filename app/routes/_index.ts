import type { LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { currentUserId } from '~/lib/auth.server'

export async function loader({ request }: LoaderArgs) {
  const userId = await currentUserId(request)

  if (userId) {
    return redirect('/feed/user')
  } else {
    return redirect('/feed/global')
  }
}
