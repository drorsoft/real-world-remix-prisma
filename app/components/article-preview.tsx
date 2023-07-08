import dayjs from 'dayjs'
import type { ArticlePreviewDTO } from '~/dto/article'

export function ArticlePreview({ article }: { article: ArticlePreviewDTO }) {
  return (
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
            <li key={tag.title} className="tag-default tag-pill tag-outline">
              {tag.title}
            </li>
          ))}
        </ul>
      </a>
    </div>
  )
}
