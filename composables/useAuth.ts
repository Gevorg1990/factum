export type AccountUser={id:string;name:string;email:string;role:'ADMIN'|'EDITOR'|'USER'}
export function useAuth(){
  const requestFetch=useRequestFetch()
  const user=useState<AccountUser|null>('account-user',()=>null)
  const ready=useState('account-ready',()=>false)
  async function refresh(){const result=await requestFetch<{user:AccountUser|null}>('/api/auth/me');user.value=result.user;ready.value=true;return user.value}
  async function logout(){await $fetch('/api/auth/logout',{method:'POST'});user.value=null;window.dispatchEvent(new Event('factum-auth-changed'))}
  return {user,ready,refresh,logout}
}
