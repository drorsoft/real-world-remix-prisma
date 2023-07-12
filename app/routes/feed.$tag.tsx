import type { Prisma } from '.prisma/client'
import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { ArticlePreview } from '~/components/article-preview'
import { Pagination } from '~/components/pagination'
import { db } from '~/lib/db.server'
import { paginate } from '~/utils/url.server'

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
      })
    },
  })
}

export default function TagFeed() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <>
      {loaderData.articles.map((article) => (
        <ArticlePreview key={article.id} article={article} />
      ))}
      <Pagination totalCount={loaderData.articlesCount._count} />
    </>
  )
}
