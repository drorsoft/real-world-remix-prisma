import { faker } from '@faker-js/faker'
import { db } from '../app/lib/db.server'

async function seed() {
  const tables = ['Article', 'Tag', 'User']

  for (const table of tables) {
    await db.$queryRawUnsafe(`DELETE FROM "${table}"`)
  }

  const users = []
  const tags = []

  for (const _ of Array.from({ length: 10 })) {
    const user = await db.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.firstName(),
        password: faker.internet.password(),
        avatar: faker.image.avatar(),
        bio: faker.lorem.paragraph(),
      },
    })

    users.push(user)
  }

  for (const _ of Array.from({ length: 30 })) {
    const tag = await db.tag.create({
      data: {
        title: faker.lorem.words(),
      },
    })

    tags.push(tag)
  }

  for (const user of users) {
    for (const _ of Array.from({ length: 20 })) {
      await db.article.create({
        data: {
          body: faker.lorem.paragraph(),
          description: faker.lorem.lines(),
          title: faker.lorem.words(),
          tags: {
            connectOrCreate: faker.helpers
              .arrayElements(tags, { min: 1, max: 3 })
              .map((tag) => ({
                where: {
                  title: tag.title,
                },
                create: {
                  title: tag.title,
                },
              })),
          },
          author: {
            connect: {
              id: user.id,
            },
          },
        },
      })
    }
  }
}

seed()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
