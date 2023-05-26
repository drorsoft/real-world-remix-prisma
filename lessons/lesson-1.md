## Login route lesson

Now that we have the register route all done and we have our user in the DB, it's time to add the login route as well.

---

**Follow these steps:**

1. Go to the RealWorld docs page, and grab the login/register [template](https://**realworld**-docs.netlify.app/docs/specs/frontend-specs/templates#loginregister).

2. Create a new route file under `/app/routes/login.tsx`.

3. Export a default function called `Login`, set the return value of the function to be the template you just copied. If you using VSCode, make sure you change any HTML related stuff like `class` instead of `className` by hand.

```jsx
export default function Login() {
  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign up</h1>
            <p className="text-xs-center">
              <a href="">Have an account?</a>
            </p>
            <ul className="error-messages">
              <li>That email is already taken</li>
            </ul>
            <form>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Your Name"
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Email"
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
                Sign up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
```

4. Now let's make some adjustments to the content:
   1. Change `Sign up` to `Sign in`.
   2. Change `Have an account?` to `Need an account?`.
   3. Change the `a` tag to be a `Link` from `@remix-run/react` and pass it a `to` prop with `/register` as the argument.
   4. Remove the `Name` input including the `fieldset`.

```jsx
import { Link } from '@remix-run/react'

export default function Login() {
  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign in</h1>
            <p className="text-xs-center">
              <Link to="/register">Need an account?</Link>
            </p>
            <ul className="error-messages">
              <li>That email is already taken</li>
            </ul>
            <form>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Email"
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
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
```

5. Add a `name` attribute to the Email input and change the `type` to `email`:
   
```jsx
<input
    className="form-control form-control-lg"
    type="email"
    placeholder="Email"
    name="email"
/>
```

6. Add a `name` attribute to the password input:

```jsx
<input
    className="form-control form-control-lg"
    type="password"
    placeholder="Password"
    name="password"
/>
```

7. OK, now it's time to actually submit this form!
   Export an async function above the default export called `action`:

```typescript
export async function action(args: ActionArgs) {
  
}
```

8. Destructure the `request` from the args and pull the values from the `FormData`:

```typescript
export async function action({ request }: ActionArgs) {
  const formData = await request.formData()

  const email = formData.get('email')
  const password = formData.get('password')
}
```

9. Great! First order of business is validating the payload and providing validation errors on failure. First we will create the `Zod` schema, we can reuse the schema we made for the `register` route. Only this time we are not going to enforce the password format:

```typescript
const LoginUserSchema = z.object({
    email: z.string().min(1, { message: "can't be blank" }).email(),
    password: z.string().min(1, { message: "can't be blank" }),
})
```

10. Next we need to actually validate the request against the validation schema:

```typescript
import type { ActionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { z } from 'zod'

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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 422 })
    }
  }
}
```

11. Before we go any further we need to handle all of the possible cases so that Remix/Typescript know what `actionData` they can assure that we get:
    1.  provide a response in case validation passes.
    2.  provide a response in case there is an error inside the `try` block that is not a `Zod` error.

```typescript
import type { ActionArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { json } from '@remix-run/node'
import { z } from 'zod'

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

    // in the the validation passes we provide 302 response using the `redirect` function
    return redirect('/')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ errors: error.flatten().fieldErrors }, { status: 422 })
    }

    // in the case that a non validation error happened, for now let's return a 400 response
    return json({ errors: {} }, { status: 400 })
  }
}
```

12. Now we can finally submit this form using Remix and get some validation feedback
    1.  change the `form` to a `Form` from `@remix-run/react` and set `method="POST"`.
    2.  call the `useActionData` hook to get the `action` response data.
    3.  loop over the errors and display them

```tsx
import { Form, Link, useActionData } from '@remix-run/react'

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
```

13. After validating the form data let's take the validated credentials and try to find a user with them:

```typescript
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const user = await db.user.findFirst({ where: { email: validated.email } })

// if we can't find a user, for security reasons we will provide a general error message that doesn't state if the problem is with the email or the password
if (!user) {
    return json({
    errors: {
        'email or password': ['is invalid'],
    },
  })
}

const match = await bcrypt.compare(validated.password, user.password)

// if we can't match the password we will return the exact same error
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
```

14. this should be your final result:

```tsx
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
```

---

### Bonus!

15. Add pending state via the disabled attribute
16. Highlight the `Sign in` link in the top navbar if the route is active

