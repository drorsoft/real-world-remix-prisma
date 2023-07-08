import {
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
  useParams,
  useSearchParams,
} from '@remix-run/react'
import dayjs from 'dayjs'
import { jsonHash } from 'remix-utils'
import { db } from '~/lib/db.server'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import clsx from 'clsx'

dayjs.extend(advancedFormat)

export async function loader() {
  return jsonHash({
    async totalArticles() {
      return db.article.count()
    },
    async popularTags() {
      return db.tag.findMany({
        select: {
          id: true,
          title: true,
        },
      })
    },
  })
}

export default function Home() {
  const loaderData = useLoaderData<typeof loader>()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const navigation = useNavigation()

  const navigatingTo = new URLSearchParams(navigation.location?.search)

  const tag = params.tag

  const activePage = navigatingTo.get('page') || searchParams.get('page') || '1'

  return (
    <div className="home-page">
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) =>
                      clsx('nav-link', isActive && 'active')
                    }
                    to="/feed/global"
                  >
                    Global Feed
                  </NavLink>
                </li>
                {tag && (
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                      }
                      to={`/feed/${tag}`}
                    >
                      # {tag}
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>
            {navigation.state === 'loading' ? (
              <p>Loading articles...</p>
            ) : (
              <Outlet />
            )}
            <nav>
              <ul className="pagination">
                {Array.from({ length: loaderData.totalArticles / 1000 }).map(
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
                        >
                          {page}
                        </NavLink>
                      </li>
                    )
                  }
                )}
              </ul>
            </nav>
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {loaderData.popularTags.map((tag) => (
                  <NavLink
                    key={tag.id}
                    to={`/feed/${tag.title}`}
                    className="tag-pill tag-default"
                  >
                    {tag.title}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
