import { Link } from '@remix-run/react'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import type { ArticlePreviewDTO } from '~/dto/article'
import { FavoriteArticleButton } from './favorite-article-button'

dayjs.extend(advancedFormat)

export function ArticlePreview({ article }: { article: ArticlePreviewDTO }) {
  return (
    <div className="article-preview" key={article.id}>
      <div className="article-meta">
        <Link to={`/profiles/${article.author.id}`}>
          <img alt="User avatar" src={article.author.avatar} />
        </Link>
        <div className="info">
          <Link className="author" to={`/profiles/${article.author.id}`}>
            {article.author.name}
          </Link>
          <span className="date">
            {dayjs(article.createdAt).format('MMMM Do')}
          </span>
        </div>
        {!article.author.isMe && (
          <FavoriteArticleButton
            articleId={article.id}
            className="pull-xs-right"
            favoritedCount={article.totalFavorites}
            isFavorited={article.isFavoritedByMe}
          />
        )}
      </div>
      <Link className="preview-link" to={`/articles/${article.id}`}>
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tags.map((tag) => (
            <li className="tag-default tag-pill tag-outline" key={tag.title}>
              {tag.title}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  )
}
