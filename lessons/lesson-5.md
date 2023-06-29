## Create an article lesson

Now that the authentication part is done we can start working on the actual core of our system. The first order of business is creating an article and displaying a "feed" of all articles.

**Goals**
1. Create a new article
2. List all articles

---

**Steps**:
1. Create a new route inside the `routes` folder called `articles.new.tsx`, this should map to `/articles/new`:
2. Inside the file create a function called `ArticlesNew` and declare it as the default export.
3. Paste in [this](https://realworld-docs.netlify.app/docs/specs/frontend-specs/templates#createedit-article) markup as the return value (don't forget to change `class` to `className`)
4. Change the `form` to the Remix `Form` and give each input a name: `title`, `description` and `body`, we won't implement the tagging functionality at this point. 
5. Now it's time to submit the form, let's export an action and extract the form data from the request:
   ```ts
    export async function action({ request }: ActionArgs) {
        const formData = await request.formData()

        const title = formData.get('title')
        const description = formData.get('description')
        const body = formData.get('body')

        // validate the form data
        // write the data to the db
        // send an http response back
    }
   ```
6. Let's create a validation schema and validate the form data:
   ```ts
   const ArticleSchema = z.object({
    title: z.string().min(1, { message: "can't be blank" }),
    description: z.string().min(1, { message: "can't be blank" }),
    body: z.string().min(1, { message: "can't be blank" }),
   })

   try {
    const validated = await ArticleSchema.parseAsync({
      title,
      description,
      body,
    })

     // write the data to the db
     // send an http response back
   } catch (error) {
    return handleExceptions(error)
   }
   ```
7. After the data has been validated, we can safely write it to the db. To do that, we need to add the `Article` model to our `Prisma` schema:
   ```prisma
   // schema.prisma

   model User {
    id       Int       @id @default(autoincrement())
    name     String
    email    String    @unique
    password String
    avatar   String    @default("https://api.realworld.io/images/smiley-cyrus.jpeg")
    bio      String?
    Session  Session?
    Article  Article[] // define the relation on the user model as well 
   }

   model Article {
    id          Int      @id @default(autoincrement())
    title       String
    description String
    body        String
    author      User     @relation(fields: [userId], references: [id])
    userId      Int
    createdAt   DateTime @default(now())
   }
   ```
8. Run `npx prisma db push` (this should generate the client but if it doesn't run `npx prisma generate`) 
9. Now let's complete the flow and actually create the new article inside the `try` statement:
    ```ts
    const article = await db.article.create({
      data: {
        body: validated.body,
        description: validated.description,
        title: validated.title,
        author: {
          connect: {
            id: userId,
          },
        },
      },
    })

    return redirect('/')
    ```
10. Let's see the new article we created on the home page, first let's declare a `loader` and fetch all the articles including the author's `name` and `avatar`:
    ```ts
    export async function loader({ request }: LoaderArgs) {
        return jsonHash({
            async articles() {
                return db.article.findMany({
                    include: {
                    author: {
                        select: {
                            avatar: true,
                            name: true,
                        },
                    },
                    },
                })
            },
        })
    }
    ```

11. Now instead of the hardcoded articles, let's loop through the articles we got from the db (run `npm i dayjs` first):
    ```tsx
    // top of the file
    import advancedFormat from 'dayjs/plugin/advancedFormat'

    dayjs.extend(advancedFormat)

    // top of the component
    const loaderData = useLoaderData<typeof loader>()

    // inside the markup
    {loaderData.articles.map((article) => (
        <div className="article-preview" key={article.id}>
            <div className="article-meta">
                <a href="profile.html">
                    <img src={article.author.avatar} />
                </a>
                <div className="info">
                <a href="" className="author">
                    {article.author.name}
                </a>
                <span className="date">
                    {dayjs(article.createdAt).format('MMMM Do')}
                </span>
                </div>
                <button className="btn btn-outline-primary btn-sm pull-xs-right">
                    <i className="ion-heart"></i> 29
                </button>
            </div>
            <a href="" className="preview-link">
                <h1>{article.title}</h1>
                <p>{article.description}</p>
                <span>Read more...</span>
            </a>
        </div>
    ))}
    ```