import type { ActionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { commitSession, getSession } from '~/lib/session.server'
import { db } from '~/lib/db.server'
import { handleExceptions } from '~/lib/http.server'
import { ErrorMessages } from '~/components/error-messages'

export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const name = formData.get('name')
  const email = formData.get('email')
  const password = formData.get('password')

  const CreateUserSchema = z.object({
    name: z
      .string()
      .min(1, { message: "can't be blank" })
      .min(2, { message: "can't be less than 2 chars" }),
    email: z
      .string()
      .min(1, { message: "can't be blank" })
      .email({ message: 'must be valid' }),
    password: z
      .string()
      .min(1, { message: "can't be blank" })
      .min(6, { message: "can't be less than 6 chars" })
      .max(20, { message: "can't be more than 20 chars" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{6,}$/, {
        message:
          'must contain at least one lower case, one capital case, one number and one symbol',
      }),
  })

  const session = await getSession(request)

  try {
    const validated = await CreateUserSchema.parseAsync({
      name,
      email,
      password,
    })

    const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: await bcrypt.hash(validated.password, 10),
      },
    })

    session.set('userId', user.id)

    session.flash(
      'success',
      'You are now successfully registered! Welcome to Conduit'
    )

    return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    })
  } catch (error) {
    session.flash('error', 'Registration failed')

    await commitSession(session)

    return handleExceptions(error)
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>()

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign up</h1>
            <p className="text-xs-center">
              <Link to="/login">Have an account?</Link>
            </p>
            {actionData?.errors && <ErrorMessages errors={actionData.errors} />}
            <Form method="POST" noValidate>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Your Name"
                  name="name"
                  aria-describedby="name-error"
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="email"
                  placeholder="Email"
                  name="email"
                  aria-describedby="email-error"
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  placeholder="Password"
                  name="password"
                  aria-describedby="password-error"
                />
              </fieldset>
              <button className="btn btn-lg btn-primary pull-xs-right">
                Sign up
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
