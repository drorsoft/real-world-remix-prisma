import { useFetcher } from '@remix-run/react'
import clsx from 'clsx'

export function FavoriteArticleButton({
  articleId,
  favoritedCount,
  hasBeenFavorited,
  children,
}: {
  articleId: number
  hasBeenFavorited: boolean
  favoritedCount: number
  children?: React.ReactNode
}) {
  const fetcher = useFetcher()

  return (
    <fetcher.Form
      style={{ display: 'inline-block' }}
      method="POST"
      action={`/api/articles/${articleId}/${
        hasBeenFavorited ? 'unfavorite' : 'favorite'
      }`}
    >
      <button
        className={clsx('btn btn-sm pull-xs-right', {
          'btn-outline-primary': !hasBeenFavorited,
          'btn-primary': hasBeenFavorited,
        })}
      >
        <i className="ion-heart"></i> {children}{' '}
        {children ? `(${favoritedCount})` : favoritedCount}
      </button>
    </fetcher.Form>
  )
}
