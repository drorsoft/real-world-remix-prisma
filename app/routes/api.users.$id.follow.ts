import { type ActionArgs, json } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { currentUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'

export async function action({ request, params }: ActionArgs) {
  const followedId = params.id

  invariant(followedId, 'id must exist in the params')

  try {
    const user = await db.user.update({
      where: {
        id: Number(followedId),
      },
      data: {
        followers: {
          connect: {
            id: await currentUserId(request),
          },
        },
      },
    })

    return json({ user, success: true })
  } catch (error) {
    return handleExceptions(error)
  }
}
