import type { Prisma } from '@prisma/client'
import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { jsonHash } from 'remix-utils'
import { z } from 'zod'
import { ErrorMessages } from '~/components/error-messages'
import { currentUser, requireLogin } from '~/lib/auth.server'
import { db } from '~/lib/db.server'
import { handleExceptions, redirectHome } from '~/lib/http.server'
import { addMessage } from '~/lib/messages.server'
import {
  nonEmptyStringSchema,
  userEmailSchema,
  userNameSchema,
  userPasswordSchema,
  validate,
} from '~/lib/validation.server'

export async function loader({ request }: LoaderArgs) {
  await requireLogin(request)

  return jsonHash({
    user() {
      return currentUser(request, {
        avatar: true,
        name: true,
        bio: true,
        email: true,
      })
    },
  })
}

export async function action({ request }: ActionArgs) {
  const userId = await requireLogin(request)

  const formData = await request.formData()

  const email = formData.get('email')
  const name = formData.get('name')
  const bio = formData.get('bio')
  const password = formData.get('password')
  const avatar = formData.get('avatar')

  const UpdateUserSchema = z.object({
    name: userNameSchema,
    bio: z.string().optional(),
    email: userEmailSchema,
    avatar: nonEmptyStringSchema.url().optional(),
    password: userPasswordSchema.or(z.literal('')),
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

    const data: Prisma.UserUpdateInput = {
      avatar: validated.avatar,
      bio: validated.bio,
      email: validated.email,
      name: validated.name,
    }

    if (validated.password) {
      data.password = validated.password
    }

    await db.user.update({
      where: {
        id: userId,
      },
      data,
    })

    await addMessage(request, 'success', 'Settings updated successfully')

    return redirectHome()
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
            <ErrorMessages errors={actionData?.errors} />
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
                    type="text"
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
