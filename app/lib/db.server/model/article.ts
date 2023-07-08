import type { Prisma } from '@prisma/client'
import { DEFAULT_PAGE_LENGTH } from '~/settings'
import { prisma } from '..'

export async function previews({
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
}
