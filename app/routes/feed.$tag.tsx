import { jsonHash } from 'remix-utils'
import { db } from '~/lib/db.server'
import { useLoaderData } from '@remix-run/react'
import type { LoaderArgs } from '@remix-run/node'
import { ArticlePreview } from '~/components/article-preview'

export async function loader({ params }: LoaderArgs) {
  const tag = params.tag

  return jsonHash({
    articles: () =>
      db.article.previews({ where: { tags: { some: { title: tag } } } }),
  })
}

export default function TagFeed() {
  const loaderData = useLoaderData<typeof loader>()

  return loaderData.articles?.map((article) => (
    <ArticlePreview key={article.id} article={article} />
  ))
}
