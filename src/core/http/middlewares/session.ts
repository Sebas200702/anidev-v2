import { defineMiddleware } from 'astro:middleware'
import { auth } from '@/core/auth/better-auth'

type SessionLocals = Pick<App.Locals, 'user' | 'session'>

const authCookieMarkers = ['session_token=', 'session_data=']

const clearSession = (locals: SessionLocals) => {
  locals.user = null
  locals.session = null
}

const hasAuthCookie = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return false
  }

  return authCookieMarkers.some((marker) => cookieHeader.includes(marker))
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/api/auth')) {
    clearSession(context.locals)

    return next()
  }

  if (!hasAuthCookie(context.request.headers.get('cookie'))) {
    clearSession(context.locals)

    return next()
  }

  try {
    const sessionData = await auth.api.getSession({
      headers: context.request.headers,
    })

    context.locals.user = sessionData?.user ?? null
    context.locals.session = sessionData?.session ?? null
  } catch {
    clearSession(context.locals)
  }

  return next()
})

export const requestSessionMiddleware = onRequest
