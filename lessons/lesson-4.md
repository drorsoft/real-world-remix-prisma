## Refactor auth system lesson

After building out the login, register and profile update features, it's time to take a good look at what we've done so far and refactor a bit before we move forward.

**Goals**
1. Avoid unnecessary DB connections.
2. Protect authenticated routes and redirect back after login.
4. Decouple "exception handling" from the "controller layer".
5. Reuse duplicated markup.
6. Make it harder to mess things up by making stupid typo's.

---

**Steps**:
1. Create a tiny abstraction around the session storage management (`session.server.ts`) and update all current consumers. This makes it harder for us to misspell the correct header name and reduces the cognitive load of having to recall the syntax every time:
```ts
export function getSession(request: Request) {
  // Avoid having to reach into the request headers manually every time.
  return sessionStorage.getSession(request.headers.get('Cookie'))
}

// re-export the commit and destroy methods.
export const commitSession = sessionStorage.commitSession
export const destroySession = sessionStorage.destroySession
``` 
2. Remove all instances of `await getSession(request.headers.get('Cookie'))` and instead use `await getSession(request)`.
3. Create a `db.server.ts` file under the `app/lib` directory and paste in the code below. This will make sure that we always have a single instance of prisma running and connected to the db:
```ts
import { PrismaClient } from '@prisma/client'

let db: PrismaClient

declare global {
  var __db__: PrismaClient | undefined
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production, we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient()
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient()
  }
  db = global.__db__
  db.$connect()
}

export { db }
```
4. Remove all instances of `const db = new PrismaClient()` and instead use `import { db } from '~/db.server'`.
5. Create a `components/error-messages.tsx` file and extract into it the error messages presentation code that we have repeated 3 times. This should make it easier for us to keep the presentation consistent and avoid silly bugs:
```tsx
export function ErrorMessages({
  errors,
}: {
  errors: Record<string, string[]>
}) {
  return (
    <ul className="error-messages">
      {Object.entries(errors).map(([key, messages]) => (
        <li key={key}>
          {key} {Array.isArray(messages) ? messages[0] : messages}
        </li>
      ))}
    </ul>
  )
}
```
6. Replace the markup with a component in the `login`, `register` and `settings` pages.
7. Create an `http.server.ts` file under the `app/lib` directory and export a function that translated application specific errors into `HTTP` responses with a consistent payload. This will allow us to add/change how our "framework" handles errors internally without having to change ant code in the "controller layer":
```ts
import type { Session } from '@remix-run/node'
import { badRequest, unprocessableEntity } from 'remix-utils'
import { z } from 'zod'
import type { SessionData, SessionFlashData } from './session.server'
import { commitSession } from './session.server'

export async function handleExceptions(
  error: unknown,
  session?: Session<SessionData, SessionFlashData>
) {
  // Having to pass in the session and set the `Set-Cookie` header is temporary until we will migrate to a different session driver in the next lesson

  if (error instanceof z.ZodError) {
    return unprocessableEntity(
      { errors: error.flatten().fieldErrors },
      {
        headers: session
          ? {
              'Set-Cookie': await commitSession(session),
            }
          : {},
      }
    )
  }

  return badRequest(
    { errors: {} },
    {
      headers: session
        ? {
            'Set-Cookie': await commitSession(session),
          }
        : {},
    }
  )
}
```
8. Remove and error handling code in any `action` and instead call out to the new `handleExceptions` function.
9. Convert any HTTP response status code definition to using helper functions from the `remix-utils` package. Instead of this `{ status: 400 }` call `badRequest()` instead.

10. Create a new file called `auth.server.ts` file under the `app/lib` directory, and export a function called `requireLogin` (this is inspired by the `@login_required` decorator from Django):
```ts
export async function requireLogin(request: Request) {
  const session = await getSession(request)

  const userId = session.get('userId')

  const url = new URL(request.url)

  const searchParams = new URLSearchParams({ next: url.pathname })

  if (!userId) {
    // set the current url as a search param in the redirect URL
    throw redirect(`/login?${searchParams.toString()}`)
  }

  return userId
}
```

11. After a successful login add some code to read the search param and redirect back to the proper location:
```ts
const url = new URL(request.url)

const next = url.searchParams.get('next')

return redirect(next || '/', {
  headers: {
    'Set-Cookie': await commitSession(session),
  },
})
```

12. Use the `requireLogin` utility function to "protect" the `/settings` route by calling the function in the first line of the `loader`.

### Bonus!

1. Use the `jsonHash` function from the `remix-utils` package where possible.
2. Add a `/logout` route and call it from the settings page.