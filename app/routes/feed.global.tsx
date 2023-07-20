import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { ArticlePreview } from '~/components/article-preview'
import { Pagination } from '~/components/pagination'
import { currentUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { paginate } from '~/utils/url.server'

export async function loader({ request }: LoaderArgs) {
  const { page } = paginate(request)

  return jsonHash({
    userId: await currentUserId(request),
    async articlesCount() {
      return db.article.count()
    },
    async articles() {
      return db.article.previews({ page })
    },
  })
}

export default function GlobalFeed() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <>
      {loaderData.articles.map((article) => (
        <ArticlePreview
          userId={loaderData.userId}
          key={article.id}
          article={article}
        />
      ))}
      <Pagination totalCount={loaderData.articlesCount} />
    </>
  )
}
