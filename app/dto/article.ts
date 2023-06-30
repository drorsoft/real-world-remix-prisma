import type { Article, Tag, User } from '@prisma/client'

export type ArticlePreviewDTO = Pick<
  Article,
  'description' | 'title' | 'id'
> & {
  createdAt: string
  author: Pick<User, 'name' | 'avatar' | 'id'>
  tags: Array<Pick<Tag, 'title'>>
}
