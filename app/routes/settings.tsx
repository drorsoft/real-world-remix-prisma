import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { z } from 'zod'
import { ErrorMessages } from '~/components/error-messages'
import { currentUserId, requireUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request)

  return jsonHash({
    async user() {
      return db.user.findUnique({
        where: { id: userId },
        select: {
          avatar: true,
          bio: true,
          email: true,
          name: true,
        },
      })
    },
  })
}

export async function action({ request }: ActionArgs) {
  const userId = await currentUserId(request)

  const formData = await request.formData()

  const name = formData.get('name')
  const email = formData.get('email')
  const avatar = formData.get('avatar')
  const bio = formData.get('bio')

  const UpdateUserSchema = z.object({
    name: z
      .string()
      .min(1, { message: "can't be blank" })
      .min(2, { message: "can't be less than 2 chars" }),
    email: z.string().min(1, { message: "can't be blank" }).email(),
    avatar: z.string().url(),
    bio: z.string().optional(),
  })

  try {
    const validated = await UpdateUserSchema.parseAsync({
      email,
      name,
      bio,
      avatar,
    })

    await db.user.update({ where: { id: userId }, data: validated })

    return redirect('/')
  } catch (error) {
    return handleExceptions(error)
  }
}

export default function Settings() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>
            {actionData && <ErrorMessages errors={actionData.errors} />}
            <Form method="POST">
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="URL of profile picture"
                    name="avatar"
                    defaultValue={loaderData.user?.avatar}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Your Name"
                    name="name"
                    defaultValue={loaderData.user?.name}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    name="bio"
                    defaultValue={loaderData.user?.bio || ''}
                  ></textarea>
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    placeholder="Email"
                    name="email"
                    defaultValue={loaderData.user?.email}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="Password"
                  />
                </fieldset>
                <button className="btn btn-lg btn-primary pull-xs-right">
                  Update Settings
                </button>
              </fieldset>
            </Form>
            <hr />
            <Form method="POST" action="/logout">
              <button className="btn btn-outline-danger">
                Or click here to logout.
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
