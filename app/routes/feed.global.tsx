import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { ArticlePreview } from '~/components/article-preview'
import { db } from '~/lib/db.server'

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url)

  const page = url.searchParams.get('page') || '1'

  return jsonHash({
    async articles() {
      return db.article.previews({ page })
    },
  })
}

export default function GlobalFeed() {
  const loaderData = useLoaderData<typeof loader>()

  return loaderData.articles.map((article) => (
    <ArticlePreview key={article.id} article={article} />
  ))
}
