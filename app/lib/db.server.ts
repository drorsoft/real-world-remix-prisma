import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | undefined

declare global {
  var __prisma__: PrismaClient | undefined
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production, we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.__prisma__) {
    global.__prisma__ = new PrismaClient()
  }
  prisma = global.__prisma__
  prisma.$connect()
}

const db = prisma.$extends({
  model: {
    article: {
      async previews({ where }: { where?: Prisma.ArticleWhereInput } = {}) {
        return await prisma?.article.findMany({
          where,
          select: {
            id: true,
            createdAt: true,
            title: true,
            description: true,
            author: {
              select: {
                name: true,
                avatar: true,
                id: true,
              },
            },
            tags: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        })
      },
    },
  },
})

export { db }
