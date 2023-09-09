import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { DEFAULT_PAGE_LENGTH } from '~/utils/url'

const db = prisma.$extends({
  model: {
    article: {
      previews: async ({
        where,
        page = 1,
        userId,
      }: {
        where?: Prisma.ArticleWhereInput
        page?: number | string
        userId: number
      }) => {
        const skip = (Number(page) - 1) * DEFAULT_PAGE_LENGTH

        const articles = await prisma.article.findMany({
          skip,
          take: DEFAULT_PAGE_LENGTH,
          where,
          orderBy: {
            title: 'desc',
          },
          select: {
            id: true,
            title: true,
            description: true,
            body: true,
            userId: true,
            createdAt: true,
            // ideally we would want to use _count twice,
            // once for total and once to check for the auth user
            // but that's not something that prisma currently supports
            // so this is the best way currently
            favorited: {
              select: {
                id: true,
              },
              where: {
                id: userId,
              },
            },
            _count: {
              select: {
                favorited: true,
              },
            },
            author: {
              select: {
                avatar: true,
                name: true,
                id: true,
              },
            },
            tags: {
              select: {
                title: true,
              },
            },
          },
        })

        return articles.map((article) => ({
          id: article.id,
          body: article.body,
          title: article.title,
          description: article.description,
          createdAt: article.createdAt,
          totalFavorites: article._count.favorited,
          isFavoritedByMe: article.favorited.length > 0,
          tags: article.tags,
          author: {
            isMe: article.author.id === userId,
            id: article.author.id,
            name: article.author.name,
            avatar: article.author.avatar,
          },
        }))
      },
    },
  },
})

export { db }
