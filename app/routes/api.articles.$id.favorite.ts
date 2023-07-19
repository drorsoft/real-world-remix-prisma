import { type ActionArgs, json } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { currentUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'

export async function action({ request, params }: ActionArgs) {
  const articleId = params.id

  invariant(articleId, 'id must exist in the params')

  try {
    const article = await db.article.update({
      where: {
        id: Number(articleId),
      },
      data: {
        favorited: {
          connect: {
            id: await currentUserId(request),
          },
        },
      },
    })

    return json({ article, success: true })
  } catch (error) {
    return handleExceptions(error)
  }
}
