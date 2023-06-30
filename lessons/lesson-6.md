## Create an article lesson

Time to tackle "tagging" an article. In this lesson we will add the ability to "tag" an article with multiple tags and we will show a list of popular tags on the main page.

**Goals**
1. Add the ability to "tag" and article
2. Show all related tags in the article preview
3. Show a list of all "popular tags"

---

**Steps**:
1. First let's add the new `Tag` model to our prisma schema:
   ```prisma
   // User model
   tags        Tag[]

   model Tag {
    id       Int       @id @default(autoincrement())
    title    String    @unique()
    articles Article[]
   }
   ```
2. Now let's create a `TagsField` component inside our `article.new.tsx` route (install `@react-stately/data` to make the list management a little easier) and replace the current input with it:
   ```tsx
    function TagsField() {
        let [value, setValue] = React.useState('')
        const selectedTags = useListData<{ id: string }>({
            initialItems: [],
        })

        return (
            <fieldset className="form-group">
                <input
                    value={value}
                    onChange={(e) => setValue(e.currentTarget.value)}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        setValue('')
                        selectedTags.append({ id: e.currentTarget.value })
                    }
                    }}
                    className="form-control"
                    placeholder="Enter tags"
                />
                <div className="tag-list">
                    {selectedTags.items.map((tag) => (
                        <span key={tag.id} className="tag-default tag-pill">
                            <input value={tag.id} type="hidden" name="tag" />
                                <i
                                    onClick={() => selectedTags.remove(tag.id)}
                                    className="ion-close-round"
                                ></i>
                            {tag.id}
                        </span>
                    ))}
                </div>
            </fieldset>
        )
    }
   ```
3. Let's consume the data inside our `action`:
   ```ts
   // 1. take all the tags from the request
   const tags = formData.getAll('tag')

   // 2. add the property to the validation schema
   tags: z.array(z.string()).optional(),

   // 3. add the property to the db call
   tags: {
    connectOrCreate: validated.tags?.map((tag) => ({
        create: {
            title: tag,
        },
        where: {
            title: tag,
        },
    })),
   },
   ```
4. Add the articles list to the article preview in our home route `_index.tsx`:
   ```tsx
   <ul className="tag-list">
    {article.tags.map((tag) => (
        <li
            key={tag.title}
            className="tag-default tag-pill tag-outline"
        >
            {tag.title}
        </li>
    ))}
   </ul>
   ```
5. Replace the hardcoded list of tags with a dynamic list:
   1. Add a `popularTags` async method to the `jsonHash` returned from the `loader`:
   ```ts
   async popularTags() {
      return db.tag.findMany({
        select: {
          id: true,
          title: true,
        },
      })
    },
   ```
   2. Render the list inside the template:
   ```tsx
    {loaderData.popularTags.map((tag) => (
        <a key={tag.id} href="" className="tag-pill tag-default">
            {tag.title}
        </a>
    ))}
   ```

### Bonus!

1. Clicking on a "popular tag" adds a "tab" with the tag name and shows a list of articles related to that tag
