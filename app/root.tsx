import type { LinksFunction, LoaderArgs } from '@remix-run/node'
import type { NavLinkProps } from '@remix-run/react'
import {
  Link,
  Links,
  LiveReload,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import clsx from 'clsx'
import React from 'react'
import { jsonHash } from 'remix-utils'
import { getUserId } from './lib/auth.server'
import { db } from './lib/db.server'
import { getMessages } from './lib/messages.server'

export const links: LinksFunction = () => {
  return [
    {
      href: '//code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css',
      rel: 'stylesheet',
      type: 'text/css',
    },
    {
      href: '//fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic',
      rel: 'stylesheet',
      type: 'text/css',
    },
    {
      rel: 'stylesheet',
      href: '//demo.productionready.io/main.css',
    },
  ]
}

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserId(request)

  return jsonHash({
    async messages() {
      return getMessages(request)
    },
    async user() {
      if (!userId) return null

      return db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      })
    },
  })
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>()

  const [isFlashMessageVisible, setIsFlashMessageVisible] =
    React.useState(false)

  React.useEffect(() => {
    if (loaderData.messages.success || loaderData.messages.error) {
      setIsFlashMessageVisible(true)

      setTimeout(() => setIsFlashMessageVisible(false), 3000)
    }
  }, [loaderData.messages.error, loaderData.messages.success])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width,initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        <nav className="navbar navbar-light">
          <div className="container">
            <Link className="navbar-brand" to="/">
              conduit
            </Link>
            <ul className="nav navbar-nav pull-xs-right">
              <li className="nav-item">
                <NavbarLink to="/">Home</NavbarLink>
              </li>
              {loaderData.user ? (
                <>
                  <li className="nav-item">
                    <NavbarLink to="/articles/new">
                      {' '}
                      <i className="ion-compose"></i>&nbsp;New Article{' '}
                    </NavbarLink>
                  </li>
                  <li className="nav-item">
                    <NavbarLink to="/settings">Settings</NavbarLink>
                  </li>
                  <li className="nav-item">
                    <NavbarLink to={`/profiles/${loaderData.user.id}`}>
                      <img
                        alt="user avatar"
                        className="user-pic"
                        src={loaderData.user.avatar}
                      />
                      {loaderData.user?.name}
                    </NavbarLink>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavbarLink to="/login">Sign in</NavbarLink>
                  </li>
                  <li className="nav-item">
                    <NavbarLink to="/register">Sign up</NavbarLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
        {isFlashMessageVisible && (
          <div
            className={clsx('alert', {
              'alert-success': loaderData.messages.success,
              'alert-danger': loaderData.messages.error,
            })}
            role="alert"
            style={{ margin: 0, borderRadius: 0 }}
          >
            {loaderData.messages.success || loaderData.messages.error}
          </div>
        )}
        <Outlet />
        <footer>
          <div className="container">
            <a className="logo-font" href="/">
              conduit
            </a>
            <span className="attribution">
              An interactive learning project from{' '}
              <a href="https://thinkster.io">Thinkster</a>. Code &amp; design
              licensed under MIT.
            </span>
          </div>
        </footer>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

function NavbarLink({ children, className, ...props }: NavLinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        clsx('nav-link', isActive && 'active', className)
      }
      {...props}
    >
      {children}
    </NavLink>
  )
}
