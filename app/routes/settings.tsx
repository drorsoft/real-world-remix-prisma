import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { pick } from 'lodash'
import { ErrorMessages } from '~/components/error-messages'
import { currentUser, requireLogin } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { actionFailed, actionSucceeded } from '~/lib/http.server'
import {
  BaseUserSchema,
  userPasswordSchema,
  validate,
} from '~/lib/validation.server'

export async function loader({ request }: LoaderArgs) {
  await requireLogin(request)

  const user = await currentUser(request)

  return json({
    user: pick(user, ['name', 'bio', 'email', 'avatar']),
  })
}

export async function action({ request }: ActionArgs) {
  const userId = await requireLogin(request)

  const formData = await request.formData()

  const email = formData.get('email')
  const name = formData.get('name')
  const bio = formData.get('bio')
  const password = formData.get('password')?.toString()
  const avatar = formData.get('avatar')

  const UpdateUserSchema = BaseUserSchema.extend({
    password: userPasswordSchema.optional(),
  })

  try {
    const validated = await validate(
      {
        email,
        name,
        bio,
        password,
        avatar,
      },
      UpdateUserSchema
    )

    await db.user.update({
      where: {
        id: userId,
      },
      data: validated,
    })

    return actionSucceeded()
  } catch (error) {
    return actionFailed(error)
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
            <ErrorMessages errors={actionData?.errors} />
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
                    defaultValue={loaderData.user.bio!}
                  ></textarea>
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
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
                    name="password"
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
