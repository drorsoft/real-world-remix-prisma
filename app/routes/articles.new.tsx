import { useListData } from '@react-stately/data'
import { redirect } from '@remix-run/node'
import type { LoaderArgs, ActionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import React from 'react'
import { z } from 'zod'
import { ErrorMessages } from '~/components/error-messages'
import { requireUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'
import { addMessage } from '~/lib/messages.server'

export async function loader({ request }: LoaderArgs) {
  await requireUserId(request)

  return null
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const title = formData.get('title')
  const description = formData.get('description')
  const body = formData.get('body')
  const tags = formData.getAll('tag')

  const ArticleSchema = z.object({
    title: z.string().min(1, { message: "can't be blank" }),
    description: z.string().min(1, { message: "can't be blank" }),
    body: z.string().min(1, { message: "can't be blank" }),
    tags: z.array(z.string()).optional(),
  })

  try {
    const validated = await ArticleSchema.parseAsync({
      title,
      description,
      body,
      tags,
    })

    const userId = await requireUserId(request)

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
        tags: {
          connectOrCreate: validated.tags?.map((tag) => ({
            create: {
              title: tag,
            },
            where: {
              title: tag,
            },
          })),
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
                    className="form-control form-control-lg"
                    name="title"
                    placeholder="Article Title"
                    type="text"
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    name="description"
                    placeholder="What's this article about?"
                    type="text"
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    name="body"
                    placeholder="Write your article (in markdown)"
                    rows={8}
                  ></textarea>
                </fieldset>
                <TagsField />
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

function TagsField() {
  let [value, setValue] = React.useState('')
  const selectedTags = useListData<{ id: string }>({
    initialItems: [],
  })

  return (
    <fieldset className="form-group">
      <input
        className="form-control"
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()

            setValue('')

            selectedTags.append({ id: e.currentTarget.value })
          }
        }}
        placeholder="Enter tags"
        value={value}
      />
      <div className="tag-list">
        {selectedTags.items.map((tag) => (
          <span className="tag-default tag-pill" key={tag.id}>
            <input name="tag" type="hidden" value={tag.id} />
            <i
              className="ion-close-round"
              onClick={() => selectedTags.remove(tag.id)}
            ></i>
            {tag.id}
          </span>
        ))}
      </div>
    </fieldset>
  )
}
