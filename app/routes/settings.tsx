import { PrismaClient } from '@prisma/client'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { getSession } from '~/lib/session.server'

export async function loader({ request }: LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'))

  const userId = session.get('userId')

  const db = new PrismaClient()

  const user = await db.user.findUnique({ where: { id: userId } })

  return json({
    user: {
      name: user?.name,
      email: user?.email,
      avatar: user?.avatar,
      bio: user?.bio,
    },
  })
}

export async function action({ request }: ActionArgs) {
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

    const session = await getSession(request.headers.get('Cookie'))

    const userId = session.get('userId')

    const db = new PrismaClient()

    await db.user.update({ where: { id: userId }, data: validated })

    return redirect('/')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 422 })
    }

    return json(
      { errors: {} },
      {
        status: 400,
      }
    )
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
            {actionData && (
              <ul className="error-messages">
                {Object.entries(actionData.errors).map(([key, messages]) => (
                  <li key={key}>
                    {key} {Array.isArray(messages) ? messages[0] : messages}
                  </li>
                ))}
              </ul>
            )}
            <Form method="POST">
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="URL of profile picture"
                    name="avatar"
                    defaultValue={loaderData.user.avatar}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Your Name"
                    name="name"
                    defaultValue={loaderData.user.name}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    name="bio"
                    defaultValue={loaderData.user.bio || ''}
                  ></textarea>
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    placeholder="Email"
                    name="email"
                    defaultValue={loaderData.user.email}
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
            <button className="btn btn-outline-danger">
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
