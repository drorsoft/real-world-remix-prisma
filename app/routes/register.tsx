import type { ActionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, Link, useActionData, useNavigation } from '@remix-run/react'
import { ZodError, z } from 'zod'

function sleep() {
  return new Promise((resolve) => {
    setTimeout(resolve, 3000)
  })
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const name = formData.get('name')
  const email = formData.get('email')
  const password = formData.get('password')

  await sleep()

  const CreateUserSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6, { message: 'Bad password dummy!' }).max(12),
  })

  try {
    const validated = await CreateUserSchema.parseAsync({
      name,
      email,
      password,
    })

    // create a user in the db
    console.log('🚀 ~ file: register.tsx:20 ~ action ~ validated:', validated)

    return redirect('/')
  } catch (error) {
    if (error instanceof ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 422 })
    }

    return json({ errors: {} }, { status: 400 })
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()

  const isPending =
    navigation.state === 'submitting' || navigation.state === 'loading'

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign up</h1>
            <p className="text-xs-center">
              <Link to="/login">Have an account?</Link>
            </p>

            {actionData?.errors && !isPending && (
              <ul className="error-messages">
                {Object.entries(actionData.errors).map(([key, message]) => (
                  <li key={key}>
                    {key}: {String(message)}
                  </li>
                ))}
              </ul>
            )}

            <Form method="POST">
              <fieldset disabled={isPending}>
                <fieldset className="form-group">
                  <input
                    name="name"
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Your Name"
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="email"
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Email"
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="password"
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="Password"
                  />
                </fieldset>
              </fieldset>
              <button
                disabled={isPending}
                type="submit"
                className="btn btn-lg btn-primary pull-xs-right"
              >
                {isPending ? 'Loading...' : 'Sign up'}
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}
