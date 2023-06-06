import type { ActionArgs } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { ErrorMessages } from '~/components/error-messages'
import { createUser, login } from '~/lib/auth.server'
import { handleExceptions } from '~/lib/http.server'
import { addMessage } from '~/lib/messages.server'

export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const name = formData.get('name')
  const email = formData.get('email')
  const password = formData.get('password')

  try {
    const user = await createUser({
      email,
      name,
      password,
    })

    await addMessage(request, 'success', 'Registration successful')

    return login(request, user)
  } catch (error) {
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
            {actionData && <ErrorMessages errors={actionData.errors} />}
            <Form method="POST">
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Your Name"
                  name="name"
                />
              </fieldset>
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
                Sign up
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
