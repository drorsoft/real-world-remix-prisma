import { json, type LoaderArgs } from '@remix-run/node'
import { Link, NavLink, Outlet, useLoaderData } from '@remix-run/react'
import clsx from 'clsx'
import { notFound } from 'remix-utils'
import invariant from 'tiny-invariant'
import { FollowUserButton } from '~/components/follow-user-button'
import { currentUserId } from '~/lib/auth.server'
import { db } from '~/lib/db.server'

export async function loader({ request, params }: LoaderArgs) {
  invariant(params.id, 'user id must exist in the params')

  const userId = await currentUserId(request)

  const profileId = Number(params.id)

  const profile = await db.user.findUnique({
    where: { id: profileId },
    select: { name: true, bio: true, avatar: true, id: true, followers: true },
  })

  if (!profile) {
    throw notFound(`a user with and id of ${profileId} was not found`)
  }

  return json({
    isFollowing: profile.followers.some(({ id }) => id === userId),
    profile,
    userId,
  })
}

export default function Profile() {
  const loaderData = useLoaderData<typeof loader>()

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img
                src={loaderData.profile.avatar}
                alt="user avatar"
                className="user-img"
              />
              <h4>{loaderData.profile.name}</h4>
              <p>{loaderData.profile.bio}</p>
              {loaderData.profile.id !== loaderData.userId && (
                <FollowUserButton
                  userId={loaderData.profile.id}
                  isFollowing={loaderData.isFollowing}
                  userName={loaderData.profile.name}
                />
              )}
              {loaderData.profile.id === loaderData.userId && (
                <Link
                  to="/settings"
                  className="btn btn-sm btn-outline-secondary action-btn"
                >
                  <i className="ion-gear-a"></i>
                  &nbsp; Edit Profile Settings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) =>
                      clsx('nav-link', isActive && 'active')
                    }
                    to=""
                    end
                  >
                    My Articles
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) =>
                      clsx('nav-link', isActive && 'active')
                    }
                    to="favorited"
                  >
                    Favorited Articles
                  </NavLink>
                </li>
              </ul>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
