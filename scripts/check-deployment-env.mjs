// A missing database must fail the deployment before it replaces the live application.
export function deploymentProblems(env) {
  if (!env.VERCEL || env.VERCEL_ENV === 'development') return []
  const problems = []
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    if (!env[key]) { problems.push(`${key} is required for the PostgreSQL-backed application.`); continue }
    try {
      const url = new URL(env[key])
      if (!['postgres:', 'postgresql:'].includes(url.protocol)) problems.push(`${key} must be a PostgreSQL connection URL.`)
      if (['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'].includes(url.hostname)) problems.push(`${key} points to a local database; Vercel needs a reachable hosted PostgreSQL database.`)
    } catch { problems.push(`${key} is not a valid connection URL.`) }
  }
  if (env.NUXT_PUBLIC_SITE_URL) {
    try { if (new URL(env.NUXT_PUBLIC_SITE_URL).protocol !== 'https:') problems.push('NUXT_PUBLIC_SITE_URL must use HTTPS on Vercel.') }
    catch { problems.push('NUXT_PUBLIC_SITE_URL is not a valid website URL.') }
  }
  return problems
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const problems = deploymentProblems(process.env)
  if (problems.length) {
    console.error('FACTUM deployment configuration is incomplete:\n' + problems.map(problem => `- ${problem}`).join('\n'))
    console.error('Configure the Vercel project environment, apply migrations and seed the database, then redeploy. See docs/CMS.md.')
    process.exitCode = 1
  }
}
