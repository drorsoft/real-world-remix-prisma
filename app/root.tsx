import type { LinksFunction, LoaderArgs } from '@remix-run/node'
import type { NavLinkProps } from '@remix-run/react'
import {
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
import { getSession } from './lib/session.server'
import React from 'react'
import { db } from './lib/db.server'
import { jsonHash } from 'remix-utils'
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
  const session = await getSession(request)

  const userId = session.get('userId')

  return jsonHash({
    async messages() {
      return getMessages(request)
    },
    async user() {
      if (!userId) return

      return db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
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
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <nav className="navbar navbar-light">
          <div className="container">
            <a className="navbar-brand" href="index.html">
              conduit
            </a>
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
                    <a className="nav-link" href="#/@romansandler">
                      <img
                        className="user-pic"
                        src="https://api.realworld.io/images/smiley-cyrus.jpeg"
                        alt=""
                      />
                      {loaderData.user?.name}
                    </a>
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
            <a href="/" className="logo-font">
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
