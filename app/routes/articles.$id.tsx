import type { Comment, User } from '@prisma/client'
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node'
import { Form, useLoaderData, useNavigation } from '@remix-run/react'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import React from 'react'
import { jsonHash, notFound } from 'remix-utils'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { currentUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'

dayjs.extend(advancedFormat)

export async function loader({ params, request }: LoaderArgs) {
  const articleId = params.id

  invariant(articleId, 'this route must have and ID param in the definition')

  try {
    const article = await db.article.findUnique({
      include: {
        author: {
          select: {
            name: true,
            id: true,
            avatar: true,
          },
        },
      },
      where: {
        id: Number(articleId),
      },
    })

    return jsonHash({
      article,
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
        const userId = await currentUserId(request)

        return db.user.findUnique({
          select: {
            avatar: true,
            name: true,
          },
          where: {
            id: userId,
          },
        })
      },
    })
  } catch (error) {
    throw notFound(`an article with an ID of ${articleId} was not found`)
  }
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
          <h1>{loaderData.article?.title}</h1>

          <div className="article-meta">
            <a href="">
              <img alt="" src={loaderData.article?.author.avatar} />
            </a>
            <div className="info">
              <a href="" className="author">
                {loaderData.article?.author.name}
              </a>
              <span className="date">
                {dayjs(loaderData.article?.createdAt).format('MMMM Do')}
              </span>
            </div>
            <button className="btn btn-sm btn-outline-secondary">
              <i className="ion-plus-round"></i>
              &nbsp; Follow {loaderData.article?.author.name}{' '}
              <span className="counter">(10)</span>
            </button>
            &nbsp;&nbsp;
            <button className="btn btn-sm btn-outline-primary">
              <i className="ion-heart"></i>
              &nbsp; Favorite Post <span className="counter">(29)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <p>{loaderData.article?.description}</p>
            <h2 id="introducing-ionic">{loaderData.article?.title}</h2>
            <p>{loaderData.article?.body}</p>
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
