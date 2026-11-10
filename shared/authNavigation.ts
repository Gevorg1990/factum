/** Only return to an internal application page after signing in. */
export function safeReturnPath(value:unknown):string|null {
  if(typeof value!=='string'||value.length>2000||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n\t]/.test(value))return null
  const path=value.split(/[?#]/)[0]
  if(path==='/login'||path.startsWith('/api/')||path.startsWith('/__nuxt'))return null
  return value
}
