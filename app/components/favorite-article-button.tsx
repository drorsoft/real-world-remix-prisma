import { useFetcher } from '@remix-run/react'
import clsx from 'clsx'

export function FavoriteArticleButton({
  articleId,
  favoritedCount,
  isFavorited,
  children,
}: {
  articleId: number
  isFavorited: boolean
  favoritedCount: number
  children?: React.ReactNode
}) {
  const fetcher = useFetcher()

  return (
    <button
      onClick={() => {
        fetcher.submit(
          {},
          {
            action: `/api/articles/${articleId}/${
              isFavorited ? 'unfavorite' : 'favorite'
            }`,
            method: 'POST',
          }
        )
      }}
      className={clsx('btn btn-sm', {
        'btn-outline-primary': !isFavorited,
        'btn-primary': isFavorited,
      })}
    >
      <i className="ion-heart"></i> {children}{' '}
      {children ? `(${favoritedCount})` : favoritedCount}
    </button>
  )
}
