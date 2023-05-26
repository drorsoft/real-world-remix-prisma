## Add session to login/register lesson

After we added the ability to add a user and login as a user, now we need to create a session after a successful login/register

---

**Follow these steps:**

1. First we need to create a new module that will contain all of our session related code, create a file called `session.server.ts` (the .server tells Remix to never send that code to the client) under `/app/lib`.

2. Go to the [Remix docs](https://remix.run/docs/en/1.16.1/utils/sessions#using-sessions) and copy the example code for managing a session into `session.server.ts`:

```ts
// app/sessions.ts
import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

type SessionData = {
  userId: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>(
    {
      // a Cookie from `createCookie` or the CookieOptions to create one
      cookie: {
        name: "__session",

        // all of these are optional
        domain: "remix.run",
        // Expires can also be set (although maxAge overrides it when used in combination).
        // Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
        //
        // expires: new Date(Date.now() + 60_000),
        httpOnly: true,
        maxAge: 60,
        path: "/",
        sameSite: "lax",
        secrets: ["s3cret1"],
        secure: true,
      },
    }
  );

export { getSession, commitSession, destroySession };
```

3. Now let's make some modifications:
   1. Delete all comments.
   2. Change the name of the cookie from `__session` to `real_world_remix_session` (This is just to avoid conflict with other cookies).
   3. Delete the domain key (in a production app we will want to set it to the production domain).
   4. Set the `maxAge` to `60 * 60 * 24 * 1000 * 7` (one week).
   5. Change `"s3cret1"` to `process.env.SESSION_SECRET` (we don't want this value to be committed to version control).
   6. Change the `userId` type from `string` to `number` (the prisma default it `Int`)
   7. Add a key to the `SessionFlashData` type called `success` with a `string` type (this is where we will flash success messages to)

```ts
import { createCookieSessionStorage } from '@remix-run/node'

type SessionData = {
  userId: number
}

type SessionFlashData = {
  error: string
  success: string
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: 'real_world_remix_session',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 1000 * 7,
      path: '/',
      sameSite: 'lax',
      secrets: [process.env.SESSION_SECRET],
      secure: true,
    },
  })

export { getSession, commitSession, destroySession }
```

4. Add the `SESSION_SECRET` key to your `.env` file, you can set the value to any type of hash:

```.env
SESSION_SECRET="tctU6IhE9pNy2EweqQRu8Wtbh0XEQfhz"
```

5. Now we can finally use the session in our route modules. Go to `/routes/register.tsx` and make the following changes:
   1. Retrieve the created user after saving it in the db:
   ```ts
   const user = await db.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: await bcrypt.hash(validated.password, 10),
      },
   })
   ```
   2. Set the `userId` key to the user's id (now we will be able to identify the authenticated user in all of our routes):
   ```ts
   const session = await getSession(request.headers.get('Cookie'))

   session.set('userId', user.id)
   ```
   3. Set a flash message to let the user know the authentication was successful:
   ```ts
   session.flash(
      'success',
      'You are now successfully registered! Welcome to Conduit'
   )
   ```
   4. In the success case, commit the updated session to the cookie header:
   ```ts
   return redirect('/', {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
   })
   ```
   5. Set an error message in the case that the authentication failed for a non validation related reason:
   ```ts
   session.flash('error', 'Registration failed')

    return json(
      { errors: {} },
      {
        status: 400,
        headers: {
          'Set-Cookie': await commitSession(session),
        },
      }
   )
   ```

    Here is the entire `action` code:
   ```ts
   import { commitSession, getSession } from '~/lib/session.server'

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
        email: z.string().min(1, { message: "can't be blank" }).email(),
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

    const session = await getSession(request.headers.get('Cookie'))

    try {
        const validated = await CreateUserSchema.parseAsync({
            name,
            email,
            password,
        })

        const db = new PrismaClient()

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
        if (error instanceof z.ZodError) {
            return json({ errors: error.flatten().fieldErrors }, { status: 422 })
        }

        session.flash('error', 'Registration failed')

        return json(
        { errors: {} },
        {
            status: 400,
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        }
      )
    }
   }
   ```

   6. Let's do the same thing for the `/login` route:
   ```ts
   import { commitSession, getSession } from '~/lib/session.server'

   export async function action({ request }: ActionArgs) {
    const formData = await request.formData()

    const email = formData.get('email')
    const password = formData.get('password')

    const LoginUserSchema = z.object({
        email: z.string().min(1, { message: "can't be blank" }).email(),
        password: z.string().min(1, { message: "can't be blank" }),
    })

    const session = await getSession(request.headers.get('Cookie'))

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

        session.set('userId', user.id)

        session.flash('success', `Welcome back ${user.name}!`)

        return redirect('/', {
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json({ errors: error.flatten().fieldErrors }, { status: 422 })
        }

        session.flash('error', 'Login failed')

        return json(
        { errors: {} },
        {
            status: 400,
            headers: {
                'Set-Cookie': await commitSession(session),
            },
        }
      )
    }
   }
   ```

   7. The last part is reading the session at the root level to augment the navbar accordingly:
      1. Add a `loader` and fetch the user from the DB according to the session `userId` and retrieve the flash messages:
      ```ts
      import type { LoaderArgs } from '@remix-run/node'
      import { json } from '@remix-run/node'
      import { PrismaClient } from '@prisma/client'
      import { commitSession, getSession } from './lib/session.server'

      export async function loader({ request }: LoaderArgs) {
        const session = await getSession(request.headers.get('Cookie'))

        const userId = session.get('userId')
        const successMessage = session.get('success')
        const errorMessage = session.get('error')

        let userDTO = null // DTO stands for Data Transfer Object

        if (userId) {
            const db = new PrismaClient()

            const user = await db.user.findUnique({ where: { id: userId } })

            // We only want to set the properties that our view needs
            // and that are safe to send to the frontend
            userDTO = {
                id: user?.id,
                name: user?.name,
            }
        }

        return json(
            {
                errorMessage,
                successMessage,
                user: userDTO,
            },
            { headers: { 'Set-Cookie': await commitSession(session) } }
          )
        }
      ``` 
      2. Consume the `loaderData` in our `App` component:
      ```tsx
      const loaderData = useLoaderData<typeof loader>()
      ```
      3. Conditionally render the `/login` and `/register` links if no `userId` is stored in the session:
      ```tsx
      {loaderData.user?.id ? (
        <li className="nav-item">
            <a className="nav-link" href="#/@romansandler">
                <img
                    className="user-pic"
                    src="https://api.realworld.io/images/smiley-cyrus.jpeg"
                    alt=""
                />
                {loaderData.user.name}
            </a>
        </li>
        ) : (
        <>
            <li className="nav-item">
                <NavLink
                    className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                    }
                    to="/login"
                >
                    Sign in
                </NavLink>
            </li>
            <li className="nav-item">
                <NavLink
                    className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                    }
                    to="/register"
                >
                    Sign up
                </NavLink>
            </li>
        </>
      )}
      ```
      4. Display the success or error message if it exists in the session:
      ```tsx
      {loaderData?.successMessage || loaderData?.errorMessage && (
          <div
            className={clsx('alert', {
                'alert-success': loaderData?.successMessage,
                'alert-danger': loaderData?.errorMessage,
            })}
            role="alert"
            style={{ margin: 0, borderRadius: 0 }}
          >
            {loaderData.successMessage || loaderData.errorMessage}
          </div>
      )}
      ```
8. Here is the entire `root.tsx` route:
```tsx
import type { LinksFunction, LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import clsx from 'clsx'
import { commitSession, getSession } from './lib/session.server'
import { PrismaClient } from '@prisma/client'
import React from 'react'

export const links: LinksFunction = () => {
  return [
    {
      href: '//code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css',
      rel: 'stylesheet',
      type: 'text/css',
    },
    {
      href: '//fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic',
      rel: 'stylesheet',
      type: 'text/css',
    },
    {
      rel: 'stylesheet',
      href: '//demo.productionready.io/main.css',
    },
  ]
}

export async function loader({ request }: LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'))

  const userId = session.get('userId')
  const successMessage = session.get('success')
  const errorMessage = session.get('error')

  let userDTO = null

  if (userId) {
    const db = new PrismaClient()

    const user = await db.user.findUnique({ where: { id: userId } })

    userDTO = {
      id: user?.id,
      name: user?.name,
    }
  }

  return json(
    {
      errorMessage,
      successMessage,
      user: userDTO,
    },
    { headers: { 'Set-Cookie': await commitSession(session) } }
  )
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <nav className="navbar navbar-light">
          <div className="container">
            <a className="navbar-brand" href="index.html">
              conduit
            </a>
            <ul className="nav navbar-nav pull-xs-right">
              <li className="nav-item">
                <NavLink
                  className={({ isActive }) =>
                    clsx('nav-link', isActive && 'active')
                  }
                  to="/"
                >
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="">
                  {' '}
                  <i className="ion-compose"></i>&nbsp;New Article{' '}
                </a>
              </li>
              {loaderData.user?.id ? (
                <li className="nav-item">
                  <a className="nav-link" href="#/@romansandler">
                    <img
                      className="user-pic"
                      src="https://api.realworld.io/images/smiley-cyrus.jpeg"
                      alt=""
                    />
                    {loaderData.user.name}
                  </a>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                      }
                      to="/login"
                    >
                      Sign in
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                      }
                      to="/register"
                    >
                      Sign up
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
        {loaderData?.successMessage || loaderData?.errorMessage && (
          <div
            className={clsx('alert', {
              'alert-success': loaderData.successMessage,
              'alert-danger': loaderData.errorMessage,
            })}
            role="alert"
            style={{ margin: 0, borderRadius: 0 }}
          >
            {loaderData.successMessage || loaderData.errorMessage}
          </div>
        )}
        <Outlet />
        <footer>
          <div className="container">
            <a href="/" className="logo-font">
              conduit
            </a>
            <span className="attribution">
              An interactive learning project from{' '}
              <a href="https://thinkster.io">Thinkster</a>. Code &amp; design
              licensed under MIT.
            </span>
          </div>
        </footer>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
```

---

### Bonus!

15. Make the flash message disappear after 3 seconds
16. Add an `avatar` field to the User model and make this URL `https://api.realworld.io/images/smiley-cyrus.jpeg` the default