import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { ArticlePreview } from '~/components/article-preview'
import { db } from '~/lib/db.server'

export async function loader({ params }: LoaderArgs) {
  const tag = params.tag

  return jsonHash({
    async articles() {
      return db.article.previews({
        tags: {
          some: {
            title: tag,
          },
        },
      })
    },
  })
}

export default function TagFeed() {
  const loaderData = useLoaderData<typeof loader>()

  return loaderData.articles.map((article) => (
    <ArticlePreview key={article.id} article={article} />
  ))
}
