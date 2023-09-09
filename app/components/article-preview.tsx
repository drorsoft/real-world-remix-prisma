import dayjs from 'dayjs'
import type { ArticlePreviewDTO } from '~/dto/article'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { Link } from '@remix-run/react'
import { FavoriteArticleButton } from './favorite-article-button'

dayjs.extend(advancedFormat)

export function ArticlePreview({ article }: { article: ArticlePreviewDTO }) {
  return (
    <div className="article-preview" key={article.id}>
      <div className="article-meta">
        <Link to={`/profiles/${article.author.id}`}>
          <img src={article.author.avatar} alt="User avatar" />
        </Link>
        <div className="info">
          <Link to={`/profiles/${article.author.id}`} className="author">
            {article.author.name}
          </Link>
          <span className="date">
            {dayjs(article.createdAt).format('MMMM Do')}
          </span>
        </div>
        {!article.author.isMe && (
          <FavoriteArticleButton
            articleId={article.id}
            isFavorited={article.isFavoritedByMe}
            favoritedCount={article.totalFavorites}
            className="pull-xs-right"
          />
        )}
      </div>
      <Link to={`/articles/${article.id}`} className="preview-link">
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
      </Link>
    </div>
  )
}
