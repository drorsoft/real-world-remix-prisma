import { useFetcher } from '@remix-run/react'
import clsx from 'clsx'

export function FollowUserButton({
  userId,
  userName,
  isFollowing,
  className,
}: {
  userId: number
  isFollowing: boolean
  className?: string
  userName: string
}) {
  const fetcher = useFetcher()

  return (
    <button
      className={clsx(
        'btn btn-sm action-btn',
        {
          'btn-outline-secondary': !isFollowing,
          'btn-secondary': isFollowing,
        },
        className
      )}
      onClick={() => {
        fetcher.submit(
          {},
          {
            action: `/api/users/${userId}/${
              isFollowing ? 'unfollow' : 'follow'
            }`,
            method: 'POST',
          }
        )
      }}
    >
      <i
        className={clsx(isFollowing ? 'ion-minus-round' : 'ion-plus-round')}
      ></i>{' '}
      {isFollowing ? 'Unfollow' : 'Follow'} {userName}
    </button>
  )
}
