import type { Article, Tag, User } from '@prisma/client'

export type ArticlePreviewDTO = Pick<
  Article,
  'id' | 'body' | 'description' | 'title'
> & {
  author: Pick<User, 'avatar' | 'name' | 'id'> & { isMe: boolean }
  tags: Pick<Tag, 'title'>[]
  createdAt: string
  totalFavorites: number
  isFavoritedByMe: boolean
}
