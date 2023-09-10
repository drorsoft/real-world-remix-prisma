import type { Prisma } from '.prisma/client'
import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { ArticlePreview } from '~/components/article-preview'
import { EmptyArticlesListMessage } from '~/components/empty-articles-list-message'
import { Pagination } from '~/components/pagination'
import { requireUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { paginate } from '~/utils/url'

export async function loader({ params, request }: LoaderArgs) {
  const tag = params.tag

  const { page } = paginate(request)

  const where: Prisma.ArticleWhereInput = {
    tags: {
      some: {
        title: tag,
      },
    },
  }

  const userId = await requireUserId(request)

  return jsonHash({
    async articlesCount() {
      return db.article.aggregate({
        where,
        _count: true,
      })
    },
    async articles() {
      return db.article.previews({
        where,
        page,
        userId,
      })
    },
  })
}

export default function TagFeed() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <>
      {loaderData.articles.length === 0 && <EmptyArticlesListMessage />}
      {loaderData.articles.map((article) => (
        <ArticlePreview article={article} key={article.id} />
      ))}
      <Pagination totalCount={loaderData.articlesCount._count} />
    </>
  )
}
