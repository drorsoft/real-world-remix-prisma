import type { LinksFunction, LoaderArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
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
import { commitSession, getSession } from './lib/session.server'
import { PrismaClient } from '@prisma/client'
import React from 'react'

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
  const session = await getSession(request.headers.get('Cookie'))

  const userId = session.get('userId')
  const successMessage = session.get('success')
  const errorMessage = session.get('error')

  let userDTO = null

  if (userId) {
    const db = new PrismaClient()

    const user = await db.user.findUnique({ where: { id: userId } })

    userDTO = {
      id: user?.id,
      name: user?.name,
    }
  }

  return json(
    {
      errorMessage,
      successMessage,
      user: userDTO,
    },
    { headers: { 'Set-Cookie': await commitSession(session) } }
  )
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>()
  const [isFlashMessageVisible, setIsFlashMessageVisible] =
    React.useState(false)

  React.useEffect(() => {
    if (loaderData.successMessage || loaderData.errorMessage) {
      setIsFlashMessageVisible(true)

      setTimeout(() => setIsFlashMessageVisible(false), 3000)
    }
  }, [loaderData.errorMessage, loaderData.successMessage])

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
                <NavLink
                  className={({ isActive }) =>
                    clsx('nav-link', isActive && 'active')
                  }
                  to="/"
                >
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="">
                  {' '}
                  <i className="ion-compose"></i>&nbsp;New Article{' '}
                </a>
              </li>
              {loaderData.user?.id ? (
                <li className="nav-item">
                  <a className="nav-link" href="#/@romansandler">
                    <img
                      className="user-pic"
                      src="https://api.realworld.io/images/smiley-cyrus.jpeg"
                      alt=""
                    />
                    {loaderData.user.name}
                  </a>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                      }
                      to="/login"
                    >
                      Sign in
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'active')
                      }
                      to="/register"
                    >
                      Sign up
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
        {isFlashMessageVisible && (
          <div
            className={clsx('alert', {
              'alert-success': loaderData.successMessage,
              'alert-danger': loaderData.errorMessage,
            })}
            role="alert"
            style={{ margin: 0, borderRadius: 0 }}
          >
            {loaderData.successMessage || loaderData.errorMessage}
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
