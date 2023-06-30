import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { ArticlePreview } from '~/components/article-preview'
import { db } from '~/lib/db.server'

export function loader({ params }: LoaderArgs) {
  return jsonHash({
    async user() {
      return db.user.findUnique({
        where: {
          id: Number(params.id),
        },
        select: {
          avatar: true,
          name: true,
          bio: true,
        },
      })
    },
    async articles() {
      return db.article.previews({
        where: { author: { id: Number(params.id) } },
      })
    },
  })
}

export default function Profile() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img src={loaderData.user?.avatar} alt="" className="user-img" />
              <h4>{loaderData.user?.name}</h4>
              {loaderData.user?.bio && <p>{loaderData.user?.bio}</p>}
              <button className="btn btn-sm btn-outline-secondary action-btn">
                <i className="ion-plus-round"></i>
                &nbsp; Follow {loaderData.user?.name}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <a className="nav-link active" href="">
                    My Articles
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="">
                    Favorited Articles
                  </a>
                </li>
              </ul>
            </div>
            {loaderData.articles?.map((article) => (
              <ArticlePreview key={article.id} article={article} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
