import type { ActionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { commitSession, getSession } from '~/lib/session.server'
import { db } from '~/lib/db.server'
import { unprocessableEntity } from 'remix-utils'
import { handleExceptions } from '~/lib/http.server'
import { ErrorMessages } from '~/components/error-messages'

export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const email = formData.get('email')
  const password = formData.get('password')

  const LoginUserSchema = z.object({
    email: z.string().min(1, { message: "can't be blank" }).email(),
    password: z.string().min(1, { message: "can't be blank" }),
  })

  const session = await getSession(request)

  try {
    const validated = await LoginUserSchema.parseAsync({ email, password })

    const user = await db.user.findFirst({ where: { email: validated.email } })

    if (!user) {
      return unprocessableEntity({
        errors: {
          'email or password': ['is invalid'],
        },
      })
    }

    const match = await bcrypt.compare(validated.password, user.password)

    if (!match) {
      return unprocessableEntity({
        errors: {
          'email or password': ['is invalid'],
        },
      })
    }

    session.set('userId', user.id)

    session.flash('success', `Welcome back ${user.name}!`)

    const url = new URL(request.url)

    const next = url.searchParams.get('next')

    return redirect(next || '/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    })
  } catch (error) {
    session.flash('error', 'Login failed')

    return handleExceptions(error)
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
            {actionData?.errors && <ErrorMessages errors={actionData.errors} />}
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
