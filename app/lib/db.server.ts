import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

function createPrismaClient() {
  return new PrismaClient().$extends({
    query: {
      user: {
        async create({ args, query }) {
          args.data.password = await bcrypt.hash(args.data.password, 10)

          return query(args)
        },
        async update({ args, query }) {
          if (args.data.password) {
            args.data.password = await bcrypt.hash(
              String(args.data.password),
              10
            )
          }

          return query(args)
        },
      },
    },
  })
}

let db: ReturnType<typeof createPrismaClient>

declare global {
  var __db__: ReturnType<typeof createPrismaClient> | undefined
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production, we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
  db = createPrismaClient()
} else {
  if (!global.__db__) {
    global.__db__ = createPrismaClient()
  }
  db = global.__db__
  db.$connect()
}

export { db }
