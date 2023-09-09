import type { Prisma } from '@prisma/client'
import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import invariant from 'tiny-invariant'
import { ArticlePreview } from '~/components/article-preview'
import { EmptyArticlesListMessage } from '~/components/empty-articles-list-message'
import { Pagination } from '~/components/pagination'
import { requireUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { paginate } from '~/utils/url'

export async function loader({ params, request }: LoaderArgs) {
  invariant(params.id, 'profile id must exist in url params')

  const profileId = Number(params.id)

  const { page } = await paginate(request)

  const where: Prisma.ArticleWhereInput = {
    favorited: {
      some: {
        id: profileId,
      },
    },
  }

  const userId = await requireUserId(request)

  return jsonHash({
    userId,
    async articles() {
      return db.article.previews({ where, page, userId })
    },
    async articlesCount() {
      return db.article.count({ where })
    },
  })
}

export default function ProfileArticles() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <>
      {loaderData.articles.length === 0 && <EmptyArticlesListMessage />}
      {loaderData.articles.map((article) => (
        <ArticlePreview article={article} key={article.id} />
      ))}
      <Pagination totalCount={loaderData.articlesCount} />
    </>
  )
}
