import * as model from './extension/model'
import { prisma } from './prisma'

const db = prisma.$extends({
  model,
})

export { db }
