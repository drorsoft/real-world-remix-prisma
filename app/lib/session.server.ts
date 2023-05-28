import { createSessionStorage } from '@remix-run/node'
import { db } from './db.server'
import { isEqual } from 'lodash'
import dayjs from 'dayjs'

type SessionData = {
  userId: number
}

type SessionFlashData = {
  error: string
  success: string
}

export const sessionStorage = createSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: 'real_world_remix_session',
    httpOnly: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // one week
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production',
  },
  async createData(data, expires) {
    const session = await db.session.create({
      data: {
        expiresAt: expires!,
        payload: JSON.stringify(data),
      },
    })

    return String(session.id)
  },
  async readData(id) {
    const session = await db.session.findUnique({
      where: {
        id: Number(id),
      },
    })

    if (session) {
      // check if the session has expired
      if (dayjs(session.expiresAt).isBefore(dayjs())) {
        await db.session.delete({ where: { id: Number(id) } })

        return null
      }

      const payload = JSON.parse(session.payload)
      const payloadClone = structuredClone(payload)

      for (var key in payloadClone) {
        if (key.startsWith('__flash')) {
          delete payloadClone[key]
        }
      }

      if (!isEqual(payload, payloadClone)) {
        await db.session.update({
          where: { id: Number(id) },
          data: { payload: JSON.stringify(payloadClone) },
        })
      }

      return payload
    }

    return null
  },
  async updateData(id, data, expires) {
    await db.session.update({
      where: {
        id: Number(id),
      },
      data: {
        payload: JSON.stringify(data),
        expiresAt: expires,
      },
    })
  },
  async deleteData(id) {
    await db.session.delete({
      where: {
        id: Number(id),
      },
    })
  },
})

export const commitSession = sessionStorage.commitSession
export const destroySession = sessionStorage.destroySession

export async function getSession(request: Request) {
  return await sessionStorage.getSession(request.headers.get('Cookie'))
}
