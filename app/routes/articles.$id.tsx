import type { Comment, User } from '@prisma/client'
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node'
import { Form, Link, useLoaderData, useNavigation } from '@remix-run/react'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import React from 'react'
import { jsonHash, notFound } from 'remix-utils'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { FavoriteArticleButton } from '~/components/favorite-article-button'
import { FollowUserButton } from '~/components/follow-user-button'
import { currentUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'

dayjs.extend(advancedFormat)

export async function loader({ params, request }: LoaderArgs) {
  const articleId = params.id

  invariant(articleId, 'this route must have and ID param in the definition')

  const userId = await currentUserId(request)

  return jsonHash({
    async article() {
      const article = await db.article.findUnique({
        include: {
          favorited: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              favorited: true,
            },
          },
          author: {
            select: {
              name: true,
              id: true,
              avatar: true,
              followers: true,
            },
          },
        },
        where: {
          id: Number(articleId),
        },
      })

      if (!article) {
        throw notFound(`article with and id of ${articleId} can't be found`)
      }

      const isFollowing = article.author.followers.some(
        ({ id }) => id === userId
      )

      return {
        ...article,
        author: {
          ...article.author,
          isFollowing,
        },
      }
    },
    async comments() {
      return db.comment.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          author: {
            select: {
              avatar: true,
              name: true,
            },
          },
        },
        where: {
          articleId: Number(articleId),
        },
      })
    },
    async currentUser() {
      return db.user.findUnique({
        select: {
          avatar: true,
          name: true,
          id: true,
        },
        where: {
          id: userId,
        },
      })
    },
  })
}

export async function action({ request, params }: ActionArgs) {
  invariant(params.id, 'this route must have and ID param in the definition')

  const formData = await request.formData()

  const comment = formData.get('comment')

  const CommentSchema = z.object({
    comment: z.string().min(1),
  })

  try {
    const validated = await CommentSchema.parseAsync({ comment })

    const userId = await currentUserId(request)

    await db.comment.create({
      data: {
        body: validated.comment,
        userId,
        articleId: Number(params.id),
      },
    })

    return json({ success: true })
  } catch (error) {
    throw handleExceptions(error)
  }
}

export default function ArticleDetails() {
  const loaderData = useLoaderData<typeof loader>()
  const formRef = React.useRef<HTMLFormElement>(null)
  const navigation = useNavigation()

  const isPending =
    navigation.state === 'submitting' ||
    (navigation.formMethod === 'POST' && navigation.state === 'loading')

  const favoritedCount = loaderData?.article?._count.favorited || 0

  const isFavorited = !!loaderData.article.favorited.some(
    ({ id }) => id === loaderData.currentUser?.id
  )

  const isAuthor = loaderData.article.author.id === loaderData.currentUser?.id

  const pendingComment = {
    id: -1,
    body: navigation.formData?.get('comment')?.toString() || '',
    author: {
      name: loaderData.currentUser?.name || '',
      avatar: loaderData.currentUser?.avatar || '',
    },
    createdAt: dayjs().format('MMMM Do'),
  }

  React.useEffect(() => {
    if (navigation.state === 'submitting' && formRef.current) {
      formRef.current.reset()
    }
  }, [navigation.state])

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{loaderData.article.title}</h1>

          <div className="article-meta">
            <Link to={`/profiles/${loaderData.article.author.id}`}>
              <img alt="" src={loaderData.article.author.avatar} />
            </Link>
            <div className="info">
              <Link
                to={`/profiles/${loaderData.article.author.id}`}
                className="author"
              >
                {loaderData.article.author.name}
              </Link>
              <span className="date">
                {dayjs(loaderData.article.createdAt).format('MMMM Do')}
              </span>
            </div>
            {isAuthor ? (
              <span>
                <Link
                  className="btn btn-outline-secondary btn-sm"
                  to={`/articles/${loaderData.article.id}/edit`}
                >
                  <i className="ion-edit"></i> Edit Article
                </Link>
                &nbsp;&nbsp;
                <button className="btn btn-outline-danger btn-sm">
                  <i className="ion-trash-a"></i> Delete Article
                </button>
              </span>
            ) : (
              <span>
                <FollowUserButton
                  userId={loaderData.article.author.id}
                  isFollowing={loaderData.article.author.isFollowing}
                  userName={loaderData.article.author.name}
                />
                &nbsp;&nbsp;
                {loaderData.article.id && (
                  <FavoriteArticleButton
                    articleId={loaderData.article.id}
                    favoritedCount={favoritedCount}
                    isFavorited={isFavorited}
                  >
                    Favorite Post
                  </FavoriteArticleButton>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <p>{loaderData.article.description}</p>
            <h2 id="introducing-ionic">{loaderData.article.title}</h2>
            <p>{loaderData.article.body}</p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            <Form ref={formRef} method="POST" className="card comment-form">
              <div className="card-block">
                <textarea
                  className="form-control"
                  placeholder="Write a comment..."
                  rows={3}
                  name="comment"
                ></textarea>
              </div>
              <div className="card-footer">
                <img
                  src={loaderData.currentUser?.avatar}
                  className="comment-author-img"
                  alt=""
                />
                <button className="btn btn-sm btn-primary">Post Comment</button>
              </div>
            </Form>

            {isPending && <CommentCard comment={pendingComment} />}
            {loaderData.comments.map((comment) => (
              <CommentCard comment={comment} key={comment.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface CommentWithAuthor extends Pick<Comment, 'id' | 'body'> {
  author: Pick<User, 'avatar' | 'name'>
  createdAt: string
}

function CommentCard({ comment }: { comment: CommentWithAuthor }) {
  return (
    <div className="card" key={comment.id}>
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <a href="" className="comment-author">
          <img
            src={comment.author.avatar}
            className="comment-author-img"
            alt=""
          />
        </a>
        &nbsp;
        <a href="" className="comment-author">
          {comment.author.name}
        </a>
        <span className="date-posted">
          {dayjs(comment.createdAt).format('MMMM Do')}
        </span>
      </div>
    </div>
  )
}
