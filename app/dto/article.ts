import type { Article, Tag, User } from '@prisma/client'

export type ArticlePreviewDTO = Omit<Article, 'createdAt'> & {
  author: Pick<User, 'avatar' | 'name'>
  tags: Pick<Tag, 'title'>[]
  createdAt: string
  favorited: Array<{ id: number }>
  _count: {
    favorited: number
  }
}
