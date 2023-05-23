import { PrismaClient } from '@prisma/client'
import type { ActionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const email = formData.get('email')
  const password = formData.get('password')

  const LoginUserSchema = z.object({
    email: z.string().min(1, { message: "can't be blank" }).email(),
    password: z.string().min(1, { message: "can't be blank" }),
  })

  try {
    const validated = await LoginUserSchema.parseAsync({ email, password })

    const db = new PrismaClient()

    const user = await db.user.findFirst({ where: { email: validated.email } })

    if (!user) {
      return json(
        {
          errors: {
            'email or password': ['is invalid'],
          },
        },
        { status: 422 }
      )
    }

    const match = await bcrypt.compare(validated.password, user.password)

    if (!match) {
      return json(
        {
          errors: {
            'email or password': ['is invalid'],
          },
        },
        { status: 422 }
      )
    }

    return redirect('/')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 422 })
    }

    return json({ errors: {} }, { status: 400 })
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>()

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign in</h1>
            <p className="text-xs-center">
              <Link to="/register">Need an account?</Link>
            </p>
            {actionData?.errors && (
              <ul className="error-messages">
                {Object.entries(actionData.errors).map(([key, messages]) => (
                  <li key={key}>
                    {key} {Array.isArray(messages) ? messages[0] : messages}
                  </li>
                ))}
              </ul>
            )}
            <Form method="POST">
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="email"
                  placeholder="Email"
                  name="email"
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
                Sign in
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
