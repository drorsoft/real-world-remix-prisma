import { type LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import dayjs from 'dayjs'
import { jsonHash } from 'remix-utils'
import { db } from '~/lib/db.server'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat)

export async function loader({ request }: LoaderArgs) {
  return jsonHash({
    async articles() {
      return db.article.findMany({
        include: {
          author: {
            select: {
              avatar: true,
              name: true,
            },
          },
          tags: {
            select: {
              title: true,
            },
          },
        },
      })
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
                  <a className="nav-link disabled" href="">
                    Your Feed
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link active" href="">
                    Global Feed
                  </a>
                </li>
              </ul>
            </div>
            {loaderData.articles.map((article) => (
              <div className="article-preview" key={article.id}>
                <div className="article-meta">
                  <a href="profile.html">
                    <img src={article.author.avatar} />
                  </a>
                  <div className="info">
                    <a href="" className="author">
                      {article.author.name}
                    </a>
                    <span className="date">
                      {dayjs(article.createdAt).format('MMMM Do')}
                    </span>
                  </div>
                  <button className="btn btn-outline-primary btn-sm pull-xs-right">
                    <i className="ion-heart"></i> 29
                  </button>
                </div>
                <a href="" className="preview-link">
                  <h1>{article.title}</h1>
                  <p>{article.description}</p>
                  <span>Read more...</span>
                  <ul className="tag-list">
                    {article.tags.map((tag) => (
                      <li
                        key={tag.title}
                        className="tag-default tag-pill tag-outline"
                      >
                        {tag.title}
                      </li>
                    ))}
                  </ul>
                </a>
              </div>
            ))}
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                {loaderData.popularTags.map((tag) => (
                  <a key={tag.id} href="" className="tag-pill tag-default">
                    {tag.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
