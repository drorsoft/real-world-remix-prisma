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

export async function loader() {
  return jsonHash({
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

  const tag = params.tag

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
                      to={`/feed/tags/${tag}`}
                    >
                      # {tag}
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
                    to={`/feed/tags/${tag.title}`}
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
