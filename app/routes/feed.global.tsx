import { jsonHash } from 'remix-utils'
import { db } from '~/lib/db.server'
import { useLoaderData } from '@remix-run/react'
import { ArticlePreview } from '~/components/article-preview'

export async function loader() {
  return jsonHash({
    articles: () => db.article.previews(),
  })
}

export default function GlobalFeed() {
  const loaderData = useLoaderData<typeof loader>()

  return loaderData.articles?.map((article) => (
    <ArticlePreview key={article.id} article={article} />
  ))
}
