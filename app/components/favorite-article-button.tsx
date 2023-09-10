import { useFetcher } from '@remix-run/react'
import clsx from 'clsx'

export function FavoriteArticleButton({
  articleId,
  favoritedCount,
  isFavorited,
  children,
  className,
}: {
  articleId: number
  isFavorited: boolean
  favoritedCount: number
  children?: React.ReactNode
  className?: string
}) {
  const fetcher = useFetcher()

  return (
    <button
      className={clsx(
        'btn btn-sm',
        {
          'btn-outline-primary': !isFavorited,
          'btn-primary': isFavorited,
        },
        className
      )}
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
    >
      <i className="ion-heart"></i> {children}{' '}
      {children ? `(${favoritedCount})` : favoritedCount}
    </button>
  )
}
