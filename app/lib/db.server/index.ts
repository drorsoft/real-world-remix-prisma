import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { DEFAULT_PAGE_LENGTH } from '~/settings'

const db = prisma.$extends({
  model: {
    article: {
      previews: async ({
        where,
        page = 1,
      }: {
        where?: Prisma.ArticleWhereInput
        page?: number | string
      } = {}) => {
        const skip = (Number(page) - 1) * DEFAULT_PAGE_LENGTH

        return prisma.article.findMany({
          skip,
          take: DEFAULT_PAGE_LENGTH,
          where,
          orderBy: {
            title: 'desc',
          },
          include: {
            _count: {
              select: {
                favorited: true,
              },
            },
            favorited: {
              select: {
                id: true,
              },
            },
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
