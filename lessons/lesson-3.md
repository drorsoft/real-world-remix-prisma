## Add the settings page lesson

Now that we are finally authenticated, we need to have a way to update the details of our user.

---

**Follow these steps:**

1. Add a new file under the `routes` folder called `settings.tsx` and register a default export called `Settings`:
    ```tsx
    // routes/settings.tsx
    export default function Settings() {
        //
    }
    ```
2. Copy the [template](https://realworld-docs.netlify.app/docs/specs/frontend-specs/templates#settings) from the realworld docs and paste it as the return value of the function we defined above (make sure you replace `class` with `className`):
    ```tsx
    export default function Settings() {
        return (
            <div className="settings-page">
            <div className="container page">
                <div className="row">
                <div className="col-md-6 offset-md-3 col-xs-12">
                    <h1 className="text-xs-center">Your Settings</h1>

                    <form>
                    <fieldset>
                        <fieldset className="form-group">
                            <input
                                className="form-control"
                                type="text"
                                placeholder="URL of profile picture"
                            />
                        </fieldset>
                        <fieldset className="form-group">
                            <input
                                className="form-control form-control-lg"
                                type="text"
                                placeholder="Your Name"
                            />
                        </fieldset>
                        <fieldset className="form-group">
                            <textarea
                                className="form-control form-control-lg"
                                rows="8"
                                placeholder="Short bio about you"
                            ></textarea>
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
                            Update Settings
                        </button>
                    </fieldset>
                    </form>
                    <hr />
                    <button className="btn btn-outline-danger">
                        Or click here to logout.
                    </button>
                    </div>
                </div>
              </div>
            </div>
        )
    }
    ```
3. Now lets add a link to our navbar that navigates to our new route, put it right above the user's avatar:
    ```tsx
    <li className="nav-item">
        <NavLink
            className={({ isActive }) =>
                clsx('nav-link', isActive && 'active')
            }
            to="/settings"
        >
            Settings
        </NavLink>
    </li>
    ```
4. Back to the route component, let's define a `loader` to fetch the authenticated user from our DB so that we can populate the form with the data:
    ```tsx
    import { PrismaClient } from '@prisma/client'
    import { LoaderArgs, json } from '@remix-run/node'
    import { getSession } from '~/lib/session.server'

    export async function loader({ request }: LoaderArgs) {
        const session = await getSession(request.headers.get('Cookie'))

        const userId = session.get('userId')

        const db = new PrismaClient()

        const user = await db.user.findUnique({ where: { id: userId } })

        return json({
            user: {
            name: user?.name,
            email: user?.email,
            avatar: '???',
            bio: '???',
            },
        })
    }
    ```
 5. Notice that we are missing 2 properties that exist in the form: `avatar` and `bio`, let's add them to our Prisma schema:
    ```prisma
    model User {
        id       Int     @id @default(autoincrement())
        name     String
        email    String  @unique
        password String
        avatar   String  @default("https://api.realworld.io/images/smiley-cyrus.jpeg")
        bio      String?
    }
    ```
6. Let's run `npx prisma db push` to update our DB and generate a new Prisma client. If you get a "prompt" asking if you're sure, type `y`.
7. Now let's go back to the `loader` we defined above and add the missing fields:
    ```ts
    export async function loader({ request }: LoaderArgs) {
        const session = await getSession(request.headers.get('Cookie'))

        const userId = session.get('userId')

        const db = new PrismaClient()

        const user = await db.user.findUnique({ where: { id: userId } })

        return json({
            user: {
            name: user?.name,
            email: user?.email,
            avatar: user?.avatar,
            bio: user?.bio,
            },
        })
    }
    ```
8. Let's pull the data from the `loader` and populate the form:
   ```tsx
   export default function Settings() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="settings-page">
        <div className="container page">
            <div className="row">
            <div className="col-md-6 offset-md-3 col-xs-12">
                <h1 className="text-xs-center">Your Settings</h1>

                <form>
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
                        defaultValue={loaderData.user.bio || ''}
                    ></textarea>
                    </fieldset>
                    <fieldset className="form-group">
                    <input
                        className="form-control form-control-lg"
                        type="email"
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
                    />
                    </fieldset>
                    <button className="btn btn-lg btn-primary pull-xs-right">
                    Update Settings
                    </button>
                </fieldset>
                </form>
                <hr />
                <button className="btn btn-outline-danger">
                Or click here to logout.
                </button>
            </div>
            </div>
        </div>
        </div>
        )
    }
   ```
9. Time to submit the form, change the `form` tag to `Form` (import from remix-run/react) and set the method to POST.
10. Export a named function called `action` to defined the HTTP handler and pull the data from the request:
    ```ts
    export async function action({ request }: ActionArgs) {
        const formData = await request.formData()

        const name = formData.get('name')
        const email = formData.get('email')
        const avatar = formData.get('avatar')
        const bio = formData.get('bio')
    }
    ``` 
11. Before we can save anything to the DB we need to validate the request:
    ```ts
    const UpdateUserSchema = z.object({
        name: z
            .string()
            .min(1, { message: "can't be blank" })
            .min(2, { message: "can't be less than 2 chars" }),
        email: z.string().min(1, { message: "can't be blank" }).email(),
        avatar: z.string().url(),
        bio: z.string().optional(),
    })

    try {
        const validated = await UpdateUserSchema.parseAsync({
            email,
            name,
            bio,
            avatar,
        })

        // update the record in the db

        return redirect('/')
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json({ errors: error.flatten().fieldErrors }, { status: 422 })
        }

        return json(
            { errors: {} },
            {
                status: 400,
            }
        )
    }
    ```
12. Now let's pull the action data from the `action` in the component and render the error messages:
    ```tsx
    export default function Settings() {
        const loaderData = useLoaderData<typeof loader>()
        const actionData = useActionData<typeof action>()

        return (
            <div className="settings-page">
            <div className="container page">
                <div className="row">
                <div className="col-md-6 offset-md-3 col-xs-12">
                    <h1 className="text-xs-center">Your Settings</h1>
                    {actionData && (
                        <ul className="error-messages">
                            {Object.entries(actionData.errors).map(([key, messages]) => (
                            <li key={key}>
                                {key} {Array.isArray(messages) ? messages[0] : messages}
                            </li>
                            ))}
                        </ul>
                    )}
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
                            defaultValue={loaderData.user.bio || ''}
                        ></textarea>
                        </fieldset>
                        <fieldset className="form-group">
                        <input
                            className="form-control form-control-lg"
                            type="email"
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
                        />
                        </fieldset>
                        <button className="btn btn-lg btn-primary pull-xs-right">
                        Update Settings
                        </button>
                    </fieldset>
                    </Form>
                    <hr />
                    <button className="btn btn-outline-danger">
                    Or click here to logout.
                    </button>
                </div>
                </div>
            </div>
            </div>
        )
        }
    ```
13. Final step is to update the record in the db:
    ```ts
    const session = await getSession(request.headers.get('Cookie'))

    const userId = session.get('userId')

    const db = new PrismaClient()

    await db.user.update({ where: { id: userId }, data: validated })
    ``` 

### Bonus!

15. Add a flash success message before the redirect home
16. Update the password only if it exists in the request (don't forge to hash it)
17. Add pending state to the submit button via the `disabled` attribute