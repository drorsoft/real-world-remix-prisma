import { type LoaderArgs } from '@remix-run/node'
import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  useParams,
} from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { db } from '~/lib/db.server'
import clsx from 'clsx'
import { currentUserId } from '~/lib/auth.server'

export async function loader({ request }: LoaderArgs) {
  const userId = await currentUserId(request)

  return jsonHash({
    userId,
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
                {loaderData.userId && (
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                      }
                      to="/feed/user"
                    >
                      Your Feed
                    </NavLink>
                  </li>
                )}
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
                {params.tag && (
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                      }
                      to={`/feed/${params.tag}`}
                    >
                      # {params.tag}
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>
            <Outlet />
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {loaderData.popularTags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/feed/${tag.title}`}
                    className="tag-pill tag-default"
                  >
                    {tag.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
