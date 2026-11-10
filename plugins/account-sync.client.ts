import { progressState, initializeProgress } from '~/composables/useProgress'

type BookmarkChanges=Record<string,boolean>
type ProgressChanges=Record<string,string|null>
export default defineNuxtPlugin(()=>{
  const {user,refresh}=useAuth()
  const syncError=useState('account-sync-error',()=> '')
  const syncStatus=useState<'idle'|'loading'|'saving'|'saved'|'error'>('account-sync-status',()=> 'idle')
  let applying=false,initialized=true,connecting=false,owner:string|null=null,generation=0
  let chain=Promise.resolve()
  let remote=new Set<string>()
  const localKeys=()=>Object.keys(localStorage).filter(key=>/^factum-(?!saved$|library$)/.test(key))
  const bookmarkKey=(account:string)=>`account-bookmark-changes:${account}`
  const progressKey=(account:string)=>`account-progress-outbox:${account}`
  function readObject<T>(key:string):Record<string,T>{try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}}
  function fail(){syncStatus.value='error';syncError.value='Փոփոխությունները դեռ չեն համաժամացվել։ Ստուգիր կապը․ այն վերականգնվելուց հետո նորից կփորձենք։'}
  function enqueue(task:()=>Promise<void>){chain=chain.catch(()=>{}).then(task).catch(fail)}
  function markSynced(){if(owner&&!connecting&&!Object.keys(readObject(bookmarkKey(owner))).length&&!Object.keys(readObject(progressKey(owner))).length){syncError.value='';syncStatus.value='saved'}}
  function stageBookmarks(account:string,changes:BookmarkChanges){localStorage.setItem(bookmarkKey(account),JSON.stringify({...readObject<boolean>(bookmarkKey(account)),...changes}))}
  async function flushBookmarks(account:string){
    while(owner===account){
      const batch=Object.entries(readObject<boolean>(bookmarkKey(account)))
      if(!batch.length)break
      for(const [key,adding] of batch){
        if(owner!==account)return
        await $fetch('/api/account/bookmarks',{method:adding?'POST':'DELETE',body:{key}})
        adding?remote.add(key):remote.delete(key)
        const pending=readObject<boolean>(bookmarkKey(account))
        if(pending[key]===adding){delete pending[key];localStorage.setItem(bookmarkKey(account),JSON.stringify(pending))}
      }
    }
    markSynced()
  }
  async function flushProgress(account:string){
    while(owner===account){
      const batch=Object.entries(readObject<string|null>(progressKey(account)))
      if(!batch.length)break
      for(const [key,value] of batch){
        if(owner!==account)return
        await $fetch('/api/account/progress',{method:'PUT',body:{key,value}})
        const pending=readObject<string|null>(progressKey(account))
        if(pending[key]===value){delete pending[key];localStorage.setItem(progressKey(account),JSON.stringify(pending))}
      }
    }
    markSynced()
  }
  function queueProgress(key:string,value:string|null){
    if(!initialized||applying||!user.value)return
    const account=user.value.id
    localStorage.setItem(progressKey(account),JSON.stringify({...readObject<string|null>(progressKey(account)),[key]:value}))
    syncStatus.value='saving'
    if(!connecting&&owner===account)enqueue(()=>flushProgress(account))
  }
  function clearAccountCache(){
    applying=true
    progressState.saved.value=[];progressState.read.value=[]
    localStorage.setItem('factum-saved','[]');localStorage.setItem('factum-read','[]')
    for(const key of localKeys())localStorage.removeItem(key)
    localStorage.removeItem('account-cache-owner')
    applying=false
  }
  async function connect(){
    const ticket=++generation
    connecting=true;syncStatus.value='loading'
    await refresh()
    if(ticket!==generation)return
    if(!user.value){if(localStorage.getItem('account-cache-owner'))clearAccountCache();owner=null;remote.clear();connecting=false;syncStatus.value='idle';syncError.value='';return}
    const account=user.value.id
    const cachedOwner=localStorage.getItem('account-cache-owner')
    const firstImport=localStorage.getItem(`account-imported:${account}`)!=='yes'
    const mayImport=firstImport&&(!cachedOwner||cachedOwner===account)
    const legacySaved=mayImport?[...progressState.saved.value]:[]
    const legacyProgress=mayImport?Object.fromEntries(localKeys().map(key=>[key,localStorage.getItem(key)])):{}
    const [bookmarks,progress]=await Promise.all([
      $fetch<{items:string[]}>('/api/account/bookmarks'),
      $fetch<{items:{key:string;value:any}[]}>('/api/account/progress'),
    ])
    if(ticket!==generation)return
    if(cachedOwner&&cachedOwner!==account)clearAccountCache()
    remote=new Set(bookmarks.items)
    const changes:BookmarkChanges={...Object.fromEntries(legacySaved.map(key=>[key,true])),...readObject<boolean>(bookmarkKey(account))}
    // Migrate an older version's unsent snapshot, then keep only per-item changes.
    try{
      const old=JSON.parse(localStorage.getItem(`account-outbox:${account}`)||'null')
      if(Array.isArray(old)){for(const key of old)changes[key]=true;for(const key of remote)if(!old.includes(key))changes[key]=false;localStorage.removeItem(`account-outbox:${account}`)}
    }catch{}
    stageBookmarks(account,changes)
    const visible=new Set(remote)
    for(const [key,adding] of Object.entries(changes))adding?visible.add(key):visible.delete(key)
    const serverProgress=Object.fromEntries(progress.items.map(item=>[item.key,item.value]))
    const imports:ProgressChanges={}
    for(const [key,value] of Object.entries(legacyProgress)){
      if(!Object.prototype.hasOwnProperty.call(serverProgress,key))imports[key]=value
      else if(key==='factum-read'){try{const a=JSON.parse(serverProgress[key]||'[]'),b=JSON.parse(value||'[]');if(Array.isArray(a)&&Array.isArray(b))imports[key]=JSON.stringify([...new Set([...a,...b])])}catch{}}
    }
    const pendingProgress={...imports,...readObject<string|null>(progressKey(account))}
    localStorage.setItem(progressKey(account),JSON.stringify(pendingProgress))
    applying=true
    try{
      progressState.saved.value=[...visible]
      const values:Record<string,any>={...Object.fromEntries(progress.items.map(item=>[item.key,item.value])),...pendingProgress}
      for(const [key,value] of Object.entries(values)){
        if(!key.startsWith('factum-'))continue
        if(value===null)localStorage.removeItem(key)
        else localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value))
      }
      try{const read=JSON.parse(localStorage.getItem('factum-read')||'[]');progressState.read.value=Array.isArray(read)?read:[]}catch{progressState.read.value=[]}
      localStorage.setItem('account-cache-owner',account)
    }finally{applying=false}
    owner=account;connecting=false
    window.dispatchEvent(new Event('storage'))
    enqueue(async()=>{await flushBookmarks(account);await flushProgress(account);if(owner===account){localStorage.setItem(`account-imported:${account}`,'yes');markSynced()}})
  }
  watch(progressState.saved,(values,previous)=>{
    if(!initialized||applying||progressState.restoring||!user.value)return
    const changes:BookmarkChanges={}
    for(const key of values)if(!previous.includes(key))changes[key]=true
    for(const key of previous)if(!values.includes(key))changes[key]=false
    if(!Object.keys(changes).length)return
    syncStatus.value='saving'
    const account=user.value.id
    stageBookmarks(account,changes)
    if(connecting||owner!==account)return
    enqueue(()=>flushBookmarks(account))
  },{flush:'sync'})
  const originalSet=Storage.prototype.setItem,originalRemove=Storage.prototype.removeItem
  Storage.prototype.setItem=function(key,value){originalSet.call(this,key,value);if(this===localStorage&&/^factum-(?!saved$|library$)/.test(key))queueProgress(key,value)}
  Storage.prototype.removeItem=function(key){originalRemove.call(this,key);if(this===localStorage&&/^factum-(?!saved$|library$)/.test(key))queueProgress(key,null)}
  function reconnect(){owner=null;void connect().catch(fail)}
  window.addEventListener('factum-auth-changed',()=>{localStorage.setItem('account-auth-version',String(Date.now()));reconnect()})
  window.addEventListener('storage',event=>{if(event.key==='account-auth-version')reconnect()})
  window.addEventListener('online',reconnect)
  onNuxtReady(()=>{initializeProgress();initialized=true;void connect().catch(fail)})
})
