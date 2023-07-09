import * as articleModelExtension from './extension/model/article'
import { prisma } from './prisma'

const db = prisma.$extends({
  model: {
    article: articleModelExtension,
  },
})

export { db }
