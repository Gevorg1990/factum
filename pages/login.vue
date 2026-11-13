<script setup lang="ts">
import { safeReturnPath } from '~/shared/authNavigation'
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-vue-next'

const { user, refresh } = useAuth()
const route=useRoute()
const register = ref(false)
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const name = ref('')
const error = ref('')
const busy = ref(false)
const showPassword = ref(false)

function setMode(value: boolean) {
  if (busy.value) return
  register.value = value
  error.value = ''
  showPassword.value = false
  passwordConfirmation.value = ''
}

async function submit() {
  if (busy.value) return
  error.value = ''
  if (register.value && password.value !== passwordConfirmation.value) { error.value = 'Գաղտնաբառերը չեն համընկնում'; return }
  busy.value = true
  try {
    await $fetch(`/api/auth/${register.value ? 'register' : 'login'}`, {
      method: 'POST',
      body: { email: email.value.trim(), password: password.value, passwordConfirmation: passwordConfirmation.value, name: name.value },
    })
    await refresh()
    window.dispatchEvent(new Event('factum-auth-changed'))
    const destination=safeReturnPath(route.query.next)
    await navigateTo(destination||(user.value?.role === 'ADMIN' || user.value?.role === 'EDITOR' ? '/admin' : '/'))
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Մուտքն անհաջող է․ ստուգեք կապը և տվյալները'
  } finally {
    busy.value = false
  }
}

useHead(() => ({ title: `${register.value ? 'Գրանցում' : 'Մուտք'} — COGNITIO` }))
</script>

<template>
  <main class="auth-page">
    <div class="shell auth-shell">
      <NuxtLink v-if="user" to="/" class="auth-back"><ArrowLeft :size="16" /> Վերադառնալ COGNITIO</NuxtLink><p v-else class="auth-back"><ShieldCheck :size="16"/>Կայքից օգտվելու համար անհրաժեշտ է հաշիվ</p>

      <section class="auth-card" aria-labelledby="auth-title">
        <aside class="auth-story">
          <div class="auth-brand"><Sparkles :size="20" /><span>COGNITIO</span><span class="brand-dot" /></div>
          <div class="auth-story-copy">
            <p class="auth-eyebrow">ՔՈ ՀԱՋՈՐԴ ԲԱՑԱՀԱՅՏՈՒՄԸ ՍԿՍՎՈՒՄ Է ԱՅՍՏԵՂ</p>
            <h2>Հետաքրքրությունդ<br>դարձրու <span>գիտելիք։</span></h2>
            <p class="story-description">Միացի՛ր COGNITIO-ին և ստեղծիր գիտելիքի քո անձնական աշխարհը։</p>
          </div>

          <div class="knowledge-art" aria-hidden="true">
            <div class="orbit orbit-outer" /><div class="orbit orbit-inner" />
            <div class="art-glow" />
            <span class="orbit-point point-one" /><span class="orbit-point point-two" />
            <div class="art-book"><BookOpen :size="64" :stroke-width="1.15" /><span class="book-star">✦</span></div>
            <div class="art-chip chip-bookmark"><Bookmark :size="17" /><span>Քո բացահայտումները</span></div>
            <div class="art-chip chip-spark"><Sparkles :size="18" /></div>
            <span class="art-star star-one">✧</span><span class="art-star star-two">✦</span>
          </div>

          <div class="auth-benefits">
            <p><span><Bookmark :size="15" /></span>Պահպանիր սիրելի նյութերդ</p>
            <p><span><Check :size="16" /></span>Հետևիր քո առաջընթացին</p>
            <p><span><Sparkles :size="15" /></span>Բացահայտիր ավելին՝ ամեն օր</p>
          </div>
          <p class="story-signature">Գիտելիքը՝ բոլորի համար։</p>
        </aside>

        <div class="auth-form-side">
          <div class="auth-switch" role="group" aria-label="Ընտրել մուտքը կամ գրանցումը">
            <button type="button" :class="{ active: !register }" :aria-pressed="!register" :disabled="busy" @click="setMode(false)">Մուտք</button>
            <button type="button" :class="{ active: register }" :aria-pressed="register" :disabled="busy" @click="setMode(true)">Գրանցում</button>
          </div>

          <header class="auth-form-heading">
            <span class="welcome-icon"><component :is="register ? Sparkles : UserRound" :size="24" :stroke-width="1.6" /></span>
            <h1 id="auth-title">{{ register ? 'Ստեղծիր քո հաշիվը' : 'Ուրախ ենք քեզ տեսնել' }}</h1>
            <p>{{ register ? 'Գրանցվիր՝ COGNITIO-ի բովանդակությունը բացելու համար։' : 'Կայքից օգտվելու համար մուտք գործիր քո հաշիվ։' }}</p>
          </header>

          <form class="auth-form" :aria-busy="busy" @submit.prevent="submit">
            <div v-if="register" class="auth-field">
              <label for="auth-name">Անուն</label>
              <div class="auth-input-wrap"><UserRound :size="18" /><input id="auth-name" v-model="name" :disabled="busy" required minlength="2" maxlength="100" autocomplete="name" placeholder="Քո անունը"></div>
            </div>
            <div class="auth-field">
              <label for="auth-email">Էլ․ հասցե</label>
              <div class="auth-input-wrap"><Mail :size="18" /><input id="auth-email" v-model="email" :disabled="busy" type="email" required autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="name@example.com"></div>
            </div>
            <div class="auth-field">
              <label for="auth-password">Գաղտնաբառ</label>
              <div class="auth-input-wrap"><LockKeyhole :size="18" /><input id="auth-password" v-model="password" :disabled="busy" :type="showPassword ? 'text' : 'password'" required :minlength="register ? 12 : 1" maxlength="128" :autocomplete="register ? 'new-password' : 'current-password'" placeholder="Մուտքագրիր գաղտնաբառը" :aria-describedby="register ? 'password-hint' : undefined"><button type="button" class="password-visibility" :aria-label="showPassword ? 'Թաքցնել գաղտնաբառը' : 'Ցույց տալ գաղտնաբառը'" :aria-pressed="showPassword" @click="showPassword = !showPassword"><component :is="showPassword ? EyeOff : Eye" :size="18" /></button></div>
              <p v-if="register" id="password-hint" class="field-hint"><ShieldCheck :size="13" /> Օգտագործիր առնվազն 12 նիշ։</p>
            </div>

            <div v-if="register" class="auth-field">
              <label for="auth-password-confirmation">Կրկնիր գաղտնաբառը</label>
              <div class="auth-input-wrap"><LockKeyhole :size="18" /><input id="auth-password-confirmation" v-model="passwordConfirmation" :disabled="busy" :type="showPassword ? 'text' : 'password'" required minlength="12" maxlength="128" autocomplete="new-password" placeholder="Կրկին մուտքագրիր գաղտնաբառը"></div>
            </div>

            <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
            <button type="submit" class="auth-submit" :disabled="busy"><LoaderCircle v-if="busy" class="loading-icon" :size="19" /><span>{{ busy ? 'Խնդրում ենք սպասել…' : register ? 'Ստեղծել հաշիվ' : 'Մուտք գործել' }}</span><ArrowRight v-if="!busy" :size="18" /></button>
          </form>

          <p class="auth-alternative">{{ register ? 'Արդեն ունե՞ս հաշիվ։' : 'Դեռ չունե՞ս հաշիվ։' }} <button type="button" :disabled="busy" @click="setMode(!register)">{{ register ? 'Մուտք գործիր' : 'Գրանցվիր' }}</button></p>
          <div class="auth-assurance"><ShieldCheck :size="16" /><span>Քո բացահայտումները՝ քո անձնական հաշվում։</span></div>
        </div>
      </section>
      <p class="auth-bottom-note">Բացահայտիր։ Սովորիր։ Ոգեշնչվիր։</p>
    </div>
  </main>
</template>

<style scoped>
.auth-page{position:relative;isolation:isolate;padding:38px 0 20px;background:radial-gradient(ellipse at 12% 30%,#173b642e,transparent 48%),radial-gradient(ellipse at 85% 65%,#a9782810,transparent 42%)}
.auth-shell{max-width:1100px}
.auth-back{display:inline-flex;align-items:center;gap:9px;color:#9fb2cc;font-size:12px;margin-bottom:24px;transition:color .2s}
.auth-back:hover{color:#f2cc88}
.auth-card{display:grid;grid-template-columns:.94fr 1fr;overflow:hidden;border:1px solid #32445d;border-radius:26px;background:#081426;box-shadow:0 30px 100px #0005,0 0 60px #173b6412}
.auth-story{position:relative;display:flex;flex-direction:column;padding:36px 38px 28px;overflow:hidden;background:radial-gradient(ellipse at 45% 50%,#21476c50,transparent 65%),linear-gradient(155deg,#112842,#091a31 70%);border-right:1px solid #2d425b}
.auth-story::after{content:'';position:absolute;width:280px;height:280px;right:-200px;top:-100px;border:1px solid #eac67d16;border-radius:50%;pointer-events:none}
.auth-brand{display:flex;align-items:center;gap:10px;color:#edc781}
.auth-brand>span:first-of-type{font:800 21px Arial,sans-serif;letter-spacing:4px;color:#f8f0df}
.brand-dot{height:5px;width:5px;border-radius:50%;background:#e3b96f;margin-left:auto;box-shadow:0 0 12px #e3b96f80}
.auth-story-copy{margin-top:39px;position:relative;z-index:1}
.auth-eyebrow{font-size:9px;line-height:1.8;letter-spacing:1.1px;color:#afbed2}
.auth-story h2{margin:14px 0 16px;font-size:clamp(26px,3vw,35px);line-height:1.6;font-weight:800;letter-spacing:-1px}
.auth-story h2 span{color:#edc781}
.story-description{color:#aebed3;font-size:12px;line-height:2;max-width:310px}
.knowledge-art{position:relative;min-height:208px;max-width:330px;width:100%;margin:4px auto}
.orbit{position:absolute;border:1px solid #88afd523;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-24deg)}
.orbit-outer{width:290px;height:156px}.orbit-inner{width:230px;height:123px;transform:translate(-50%,-50%) rotate(32deg);border-color:#edc78122}
.art-glow{position:absolute;width:170px;height:150px;background:radial-gradient(ellipse,#e7b75e18,transparent 70%);inset:30px 0 0;margin:auto}
.art-book{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-8deg);width:104px;height:112px;display:grid;place-items:center;border:1px solid #e3bd705c;border-radius:23px;background:linear-gradient(145deg,#25374e,#101f34);color:#f0ce8e;box-shadow:0 16px 35px #0004,inset 0 1px 0 #fff1}
.book-star{position:absolute;right:12px;top:11px;font-size:15px;color:#ffe1a2}
.art-chip{position:absolute;display:flex;align-items:center;gap:9px;border:1px solid #38536b;background:#0f2439e8;border-radius:11px;box-shadow:0 9px 25px #0003;color:#eed19a}
.chip-bookmark{left:0;bottom:27px;padding:11px 12px;font-size:10px;transform:rotate(-5deg)}
.chip-spark{right:8px;top:37px;padding:12px;transform:rotate(10deg)}
.orbit-point{position:absolute;width:5px;height:5px;border-radius:50%;background:#f1cc83;box-shadow:0 0 10px #edc78170}.point-one{left:27px;top:76px}.point-two{right:43px;bottom:45px;width:4px;height:4px;background:#7badd7}
.art-star{position:absolute;color:#e1c48d}.star-one{left:71px;top:20px;font-size:20px}.star-two{right:59px;bottom:21px;font-size:12px}
.auth-benefits{display:grid;gap:13px;margin-top:auto}
.auth-benefits p{display:flex;align-items:center;gap:11px;color:#c0ccdc;font-size:12px}
.auth-benefits p>span{display:grid;place-items:center;width:28px;height:28px;border:1px solid #d4b06b25;border-radius:8px;background:#e1b86b08;color:#e9c482}
.story-signature{margin-top:27px;padding-top:18px;border-top:1px solid #b4c4d319;color:#7f95b0;font-size:10px}
.auth-form-side{padding:32px 46px 28px;align-self:center;min-width:0}
.auth-switch{display:grid;grid-template-columns:1fr 1fr;background:#030c1a;border:1px solid #263951;padding:5px;border-radius:12px;gap:5px}
.auth-switch button{padding:10px 8px;border-radius:8px;color:#8fa3bf;font-size:12px;font-weight:600;transition:background .2s,color .2s}
.auth-switch button.active{background:#1b2b40;color:#f1d3a0;box-shadow:inset 0 1px 0 #fff1,0 2px 8px #0002}
.auth-form-heading{margin:27px 0 25px}.welcome-icon{display:grid;place-items:center;width:48px;height:48px;border:1px solid #d9b77735;background:linear-gradient(135deg,#e4bc731a,#e4bc7305);border-radius:15px;color:#edc781;margin-bottom:17px}
.auth-form-heading h1{font-size:clamp(22px,2.5vw,27px);font-weight:800;line-height:1.5;letter-spacing:-.7px;margin:0 0 9px}
.auth-form-heading p{font-size:11px;color:#97abc6;line-height:1.9}
.auth-form{display:grid;gap:18px}.auth-field label{display:block;font-size:12px;font-weight:600;color:#d4deeb;margin-bottom:9px}
.auth-input-wrap{display:flex;align-items:center;gap:11px;padding:0 14px;min-height:51px;border:1px solid #2b405b;border-radius:11px;background:#051020;transition:border-color .2s,box-shadow .2s}
.auth-input-wrap:focus-within{border-color:#d5b477;box-shadow:0 0 0 3px #e2b96912}
.auth-input-wrap>svg{color:#6f89a8;flex-shrink:0}.auth-input-wrap:focus-within>svg{color:#dbbb83}
.auth-input-wrap input{width:100%;min-width:0;background:transparent;border:0;outline:0;padding:15px 0;color:#edf3fc;font-size:12px;line-height:1.6}.auth-input-wrap input::placeholder{color:#607793;font-size:11px}.auth-input-wrap input:autofill{box-shadow:0 0 0 100px #051020 inset;-webkit-text-fill-color:#edf3fc}
.password-visibility{display:grid;place-items:center;min-width:28px;min-height:36px;color:#849ab5}.password-visibility:hover{color:#e8c98c}
.field-hint{display:flex;align-items:center;gap:5px;color:#8298b4;font-size:10px;margin:8px 0 0}
.auth-submit{display:flex;align-items:center;justify-content:center;gap:13px;width:100%;min-height:51px;margin-top:3px;padding:13px 18px;border:1px solid #f7d79a;border-radius:11px;background:linear-gradient(110deg,#f6dba5,#e7b65e);color:#172136;font-size:13px;font-weight:800;box-shadow:0 5px 20px #e9b85f13,inset 0 1px 0 #fff5;transition:filter .2s,transform .2s}
.auth-submit:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}button:disabled{opacity:.6;cursor:wait}
.auth-error{padding:11px 13px;background:#f871710c;border:1px solid #f8717140;border-radius:9px;color:#f6b1ad;font-size:11px;line-height:1.9}
.auth-alternative{text-align:center;margin:23px 0;color:#8fa5c1;font-size:11px;line-height:1.9}.auth-alternative button{color:#eccb8b;font-weight:700;margin-left:4px}
.auth-assurance{display:flex;justify-content:center;align-items:center;gap:7px;padding-top:18px;border-top:1px solid #26394f;color:#788ea9;font-size:9px;line-height:1.8}.auth-assurance svg{flex-shrink:0;color:#9aabbe}
.auth-bottom-note{text-align:center;color:#607690;font-size:10px;margin:23px 0 0;letter-spacing:1px}
.auth-card button:focus-visible,.auth-back:focus-visible{outline:2px solid #edc781;outline-offset:4px}
.loading-icon{animation:auth-spin 1s linear infinite}@keyframes auth-spin{to{transform:rotate(360deg)}}
@media(max-width:850px){.auth-story{padding:30px 26px}.auth-form-side{padding:30px}.auth-story h2{font-size:28px}.knowledge-art{transform:scale(.9);transform-origin:center}.auth-eyebrow{font-size:8px}}
@media(max-width:640px){.auth-page{padding-top:22px}.auth-shell{max-width:500px}.auth-back{margin-bottom:18px;font-size:11px}.auth-card{grid-template-columns:1fr;border-radius:22px}.auth-story{padding:24px;border-right:0;border-bottom:1px solid #2d425b}.auth-brand>span:first-of-type{font-size:18px}.auth-story-copy{margin-top:20px}.auth-story h2{font-size:25px;line-height:1.5;margin:9px 0}.auth-story h2 br{display:none}.auth-eyebrow{font-size:8px;letter-spacing:.5px}.story-description{font-size:11px;max-width:none}.knowledge-art,.auth-benefits,.story-signature{display:none}.auth-form-side{padding:25px 24px}.auth-form-heading{margin:24px 0}.welcome-icon{display:none}.auth-form-heading h1{font-size:23px}.auth-form-heading p{font-size:11px}.auth-bottom-note{font-size:9px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style>
