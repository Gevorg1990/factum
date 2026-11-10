import { currentUser, publicUser } from '../../utils/auth'
export default defineEventHandler(async event => {
  const user = await currentUser(event)
  return { user: user ? publicUser(user) : null }
})
