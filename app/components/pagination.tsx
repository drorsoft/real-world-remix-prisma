import { NavLink, useNavigation, useSearchParams } from '@remix-run/react'
import clsx from 'clsx'
import { DEFAULT_PAGE_LENGTH } from '~/settings'

export function Pagination({ totalCount }: { totalCount: number }) {
  const [searchParams] = useSearchParams()
  const navigation = useNavigation()

  const navigatingTo = new URLSearchParams(navigation.location?.search)

  const activePage = navigatingTo.get('page') || searchParams.get('page') || '1'

  const pageLength = Number(searchParams.get('take')) || DEFAULT_PAGE_LENGTH

  if (totalCount <= pageLength) return null

  return (
    <>
      {navigation.state === 'loading' && <p>Loading articles...</p>}
      <nav>
        <ul className="pagination">
          {Array.from(
            { length: Math.ceil(totalCount / pageLength) },
            (_, i) => {
              const page = i + 1

              return (
                <li
                  className={clsx(
                    'page-item',
                    Number(activePage) === page && 'active'
                  )}
                  key={i}
                >
                  <NavLink
                    className="page-link"
                    to={{ search: `?page=${page}` }}
                    preventScrollReset
                    prefetch="intent"
                  >
                    {page}
                  </NavLink>
                </li>
              )
            }
          )}
        </ul>
      </nav>
    </>
  )
}
