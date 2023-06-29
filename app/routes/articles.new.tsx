import type { LoaderArgs } from '@remix-run/node'
import { redirect, type ActionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { ErrorMessages } from '~/components/error-messages'
import { currentUserId, requireLogin } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'
import { addMessage } from '~/lib/messages.server'

export async function loader({ request }: LoaderArgs) {
  await requireLogin(request)

  return null
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const title = formData.get('title')
  const description = formData.get('description')
  const body = formData.get('body')

  const ArticleSchema = z.object({
    title: z.string().min(1, { message: "can't be blank" }),
    description: z.string().min(1, { message: "can't be blank" }),
    body: z.string().min(1, { message: "can't be blank" }),
  })

  try {
    const validated = await ArticleSchema.parseAsync({
      title,
      description,
      body,
    })

    const userId = await currentUserId(request)

    const article = await db.article.create({
      data: {
        body: validated.body,
        description: validated.description,
        title: validated.title,
        author: {
          connect: {
            id: userId,
          },
        },
      },
    })

    await addMessage(
      request,
      'success',
      `Article "${article.title}" was created successfully`
    )

    return redirect('/')
  } catch (error) {
    return handleExceptions(error)
  }
}

export default function ArticlesNew() {
  const actionData = useActionData<typeof action>()

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ErrorMessages errors={actionData?.errors} />
            <Form method="POST">
              <fieldset>
                <fieldset className="form-group">
                  <input
                    name="title"
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Article Title"
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="description"
                    type="text"
                    className="form-control"
                    placeholder="What's this article about?"
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    name="body"
                    className="form-control"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                  ></textarea>
                </fieldset>
                <fieldset className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter tags"
                  />
                  <div className="tag-list"></div>
                </fieldset>
                <button className="btn btn-lg pull-xs-right btn-primary">
                  Publish Article
                </button>
              </fieldset>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
