import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { DEFAULT_PAGE_LENGTH } from '~/settings'

let prisma: PrismaClient

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
      async previews({
        where,
        page = 1,
      }: {
        where?: Prisma.ArticleWhereInput
        page?: number | string
      } = {}) {
        const skip = (Number(page) - 1) * DEFAULT_PAGE_LENGTH

        return prisma.article.findMany({
          skip,
          take: DEFAULT_PAGE_LENGTH,
          where,
          include: {
            author: {
              select: {
                avatar: true,
                name: true,
              },
            },
            tags: {
              select: {
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
