<script setup>
import { ref } from 'vue';
import {
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from '@lucide/vue';

import BrandLogo from '../components/BrandLogo.vue';

const passwordVisible = ref(false);
const rememberMe = ref(true);
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <aside class="login-story">
        <svg class="industrial-art" viewBox="0 0 680 920" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g class="factory-lines">
            <path d="M12 620h670M62 620V352h104v268M167 620V246h138v374M305 620V330h126v290M431 620V208h110v412M541 620V300h118v320" />
            <path d="M72 352h82l-14-72H85zM185 246h101l-18-92h-65zM453 208h66l-12-96h-43z" />
            <path d="M32 430h590M44 505h605M118 290h452M205 186h294" />
            <circle cx="114" cy="406" r="24" /><circle cx="370" cy="430" r="30" /><circle cx="584" cy="385" r="22" />
          </g>
          <g class="worker">
            <path d="M500 423c35-8 74 12 89 45l42 96-15 292H414l5-273 35-101c9-28 21-51 46-59z" />
            <circle cx="518" cy="373" r="53" />
            <path d="M453 365c1-62 32-93 70-93 42 0 70 37 70 94-48-11-94-11-140-1z" />
            <path d="M446 356h154v20H446z" />
            <path d="m436 565-98 84 44 55 107-88M338 649l-86-22-13 42 143 35" />
            <rect x="220" y="602" width="122" height="88" rx="8" transform="rotate(10 220 602)" />
          </g>
        </svg>
        <div class="story-overlay" />

        <BrandLogo inverse />

        <div class="story-content">
          <h1>Smart <span>Maintenance.</span><br />Stronger <b>Facilities.</b><br />Better <em>Performance.</em></h1>
          <i class="story-rule" />
          <p>FEPPM helps you plan, track and optimize preventive maintenance across all your facilities and equipment.</p>

          <div class="story-benefits">
            <article>
              <span class="benefit-icon green"><ShieldCheck :size="24" /></span>
              <div><strong>Improve equipment reliability</strong><p>Keep your assets running at peak performance.</p></div>
            </article>
            <article>
              <span class="benefit-icon blue"><ClipboardCheck :size="24" /></span>
              <div><strong>Plan preventive maintenance</strong><p>Schedule and automate maintenance activities with ease.</p></div>
            </article>
            <article>
              <span class="benefit-icon orange"><BarChart3 :size="24" /></span>
              <div><strong>Real-time insights & reports</strong><p>Make data-driven decisions and improve compliance.</p></div>
            </article>
          </div>
        </div>
      </aside>

      <section class="login-form-panel">
        <header class="login-panel-header">
          <BrandLogo class="mobile-login-logo" compact />
          <button class="language-button" type="button">
            <Globe2 :size="18" />
            <span>English</span>
            <ChevronDown :size="15" />
          </button>
        </header>

        <div class="login-form-wrap">
          <div class="login-heading">
            <h2>Welcome back!</h2>
            <p>Sign in to continue to your FEPPM account</p>
          </div>

          <form class="login-form" @submit.prevent>
            <label class="form-field">
              <span>Email address</span>
              <span class="input-wrap">
                <Mail :size="19" />
                <input type="email" autocomplete="email" placeholder="Enter your email address" required />
              </span>
            </label>

            <label class="form-field">
              <span>Password</span>
              <span class="input-wrap">
                <LockKeyhole :size="19" />
                <input :type="passwordVisible ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" required />
                <button type="button" :aria-label="passwordVisible ? 'Hide password' : 'Show password'" @click="passwordVisible = !passwordVisible">
                  <EyeOff v-if="passwordVisible" :size="19" />
                  <Eye v-else :size="19" />
                </button>
              </span>
            </label>

            <div class="form-options">
              <label class="remember-option">
                <input v-model="rememberMe" type="checkbox" />
                <span><i>✓</i></span>
                Remember me
              </label>
              <a href="#" @click.prevent>Forgot password?</a>
            </div>

            <button class="sign-in-button" type="submit">
              <LockKeyhole :size="18" />
              Sign in
            </button>

            <div class="auth-divider"><span>or continue with</span></div>

            <div class="provider-grid">
              <button type="button"><span class="google-mark">G</span>Google</button>
              <button type="button"><span class="microsoft-mark"><i /><i /><i /><i /></span>Microsoft</button>
            </div>

            <button class="sso-button" type="button"><ShieldCheck :size="19" />SSO login</button>
          </form>

          <p class="contact-admin">Don’t have an account? <a href="mailto:admin@feppm.com">Contact administrator</a></p>
        </div>
      </section>
    </section>

    <footer class="login-footer">
      <span>© 2026 FEPPM. All rights reserved.</span>
      <a href="#" @click.prevent>Privacy policy</a><i>•</i><a href="#" @click.prevent>Terms of service</a>
    </footer>
  </main>
</template>

<style scoped>
.login-page { min-height: 100vh; display: flex; flex-direction: column; background: #fff; }
.login-card { width: 100%; min-height: calc(100vh - 60px); display: grid; grid-template-columns: minmax(430px, 46%) minmax(0, 54%); overflow: hidden; background: #fff; }
.login-story { position: relative; min-width: 0; padding: clamp(34px, 4vw, 62px) clamp(34px, 5vw, 78px) 38px; display: flex; flex-direction: column; overflow: hidden; color: #fff; background: #073e75; }
.industrial-art { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .58; }
.factory-lines { fill: rgba(104, 171, 219, .18); stroke: rgba(137, 201, 235, .35); stroke-width: 4; }
.worker { fill: rgba(2, 41, 79, .92); stroke: rgba(105, 176, 220, .25); stroke-width: 3; }
.worker rect { fill: rgba(155, 213, 240, .45); }
.story-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(4, 58, 111, .98) 0%, rgba(4, 58, 111, .86) 58%, rgba(4, 47, 90, .48) 100%), linear-gradient(0deg, rgba(3, 46, 88, .72), transparent 60%); }
.login-story :deep(.feppm-logo), .story-content { position: relative; z-index: 2; }
.story-content { width: min(480px, 100%); margin: auto 0; }
.story-content h1 { margin: 28px 0 0; font-size: clamp(30px, 3vw, 39px); font-weight: 650; letter-spacing: -.025em; line-height: 1.32; }
.story-content h1 span { color: #31ba70; }.story-content h1 b { color: #3a8af0; font-weight: 650; }.story-content h1 em { color: #ff9d1b; font-style: normal; font-weight: 650; }
.story-rule { width: 62px; height: 4px; margin: 28px 0 23px; display: block; border-radius: 4px; background: #32bd70; }
.story-content > p { max-width: 400px; margin: 0; color: #f0f7ff; font-size: 16px; line-height: 1.7; }
.story-benefits { margin-top: 45px; display: grid; gap: 22px; }
.story-benefits article { display: flex; align-items: flex-start; gap: 16px; }
.benefit-icon { width: 44px; height: 44px; display: grid; flex: 0 0 44px; place-items: center; border-radius: 13px; color: #fff; box-shadow: 0 8px 18px rgba(0,0,0,.15); }
.benefit-icon.green { background: linear-gradient(145deg, #1bc16e, #079c53); }.benefit-icon.blue { background: linear-gradient(145deg, #278cf2, #0863cf); }.benefit-icon.orange { background: linear-gradient(145deg, #ffab31, #f47f00); }
.story-benefits strong { display: block; font-size: 15px; line-height: 1.5; text-transform: capitalize; }.story-benefits p { margin: 4px 0 0; color: #e0edfa; font-size: 14px; line-height: 1.6; }
.login-form-panel { min-width: 0; padding: clamp(28px, 3vw, 48px) clamp(40px, 6vw, 92px) 38px; display: flex; flex-direction: column; background: #fff; }
.login-panel-header { min-height: 42px; display: flex; justify-content: flex-end; align-items: flex-start; }
.mobile-login-logo { display: none; }
.language-button { height: 42px; padding: 0 14px; display: flex; align-items: center; gap: 8px; border: 1px solid #d8e0ea; border-radius: 9px; background: #fff; font-size: 14px; cursor: pointer; }
.login-form-wrap { width: min(500px, 100%); margin: auto; padding: 34px 0; }
.login-heading h2 { margin: 0; color: #101828; font-size: 32px; font-weight: 700; letter-spacing: -.02em; line-height: 1.25; text-transform: capitalize; }
.login-heading p { margin: 9px 0 0; color: #475467; font-size: 16px; line-height: 1.6; }
.login-form { margin-top: 34px; }
.form-field { display: block; margin-bottom: 22px; }.form-field > span:first-child { display: block; margin-bottom: 9px; color: #101828; font-size: 15px; font-weight: 600; line-height: 1.5; text-transform: capitalize; }
.input-wrap { height: 50px; padding: 0 13px; display: flex; align-items: center; gap: 11px; border: 1px solid #d5dce6; border-radius: 8px; color: #667085; background: #fff; transition: border-color .2s, box-shadow .2s; }
.input-wrap:focus-within { border-color: #1670dc; box-shadow: 0 0 0 3px rgba(22,112,220,.12); }
.input-wrap input { min-width: 0; flex: 1; border: 0; outline: 0; color: #101828; background: transparent; font-size: 15px; line-height: 1.5; }.input-wrap input::placeholder { color: #98a2b3; }
.input-wrap button { width: 30px; height: 30px; padding: 0; display: grid; place-items: center; border: 0; color: #667085; background: transparent; cursor: pointer; }
.form-options { margin: -6px 0 26px; display: flex; justify-content: space-between; align-items: center; gap: 15px; font-size: 14px; line-height: 1.5; }
.remember-option { position: relative; display: flex; align-items: center; gap: 9px; cursor: pointer; }.remember-option input { position: absolute; opacity: 0; pointer-events: none; }.remember-option > span { width: 18px; height: 18px; display: grid; place-items: center; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; }.remember-option i { display: none; color: #fff; font-size: 12px; font-style: normal; font-weight: 700; }.remember-option input:checked + span { border-color: #1264d8; background: #1264d8; }.remember-option input:checked + span i { display: block; }
.form-options a { font-weight: 600; }
.sign-in-button { width: 100%; height: 52px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 8px; color: #fff; background: linear-gradient(100deg, #1160ca, #0874e4); box-shadow: 0 9px 18px rgba(18,100,216,.18); font-size: 16px; font-weight: 600; cursor: pointer; transition: transform .2s, box-shadow .2s; }.sign-in-button:hover { transform: translateY(-1px); box-shadow: 0 12px 23px rgba(18,100,216,.26); }
.auth-divider { margin: 28px 0; display: flex; align-items: center; gap: 14px; color: #667085; font-size: 14px; line-height: 1.5; }.auth-divider::before, .auth-divider::after { height: 1px; flex: 1; content: ''; background: #d9e0e9; }
.provider-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.provider-grid button, .sso-button { height: 50px; display: flex; align-items: center; justify-content: center; gap: 12px; border: 1px solid #d5dce6; border-radius: 8px; background: #fff; font-size: 15px; font-weight: 500; cursor: pointer; transition: background .2s, border-color .2s; }.provider-grid button:hover, .sso-button:hover { border-color: #aebbc9; background: #f8fafc; }
.google-mark { font-size: 21px; font-weight: 800; background: conic-gradient(from -45deg, #4285f4 0 25%, #34a853 0 45%, #fbbc05 0 67%, #ea4335 0); background-clip: text; color: transparent; }
.microsoft-mark { width: 19px; height: 19px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }.microsoft-mark i:nth-child(1) { background: #f25022; }.microsoft-mark i:nth-child(2) { background: #7fba00; }.microsoft-mark i:nth-child(3) { background: #00a4ef; }.microsoft-mark i:nth-child(4) { background: #ffb900; }
.sso-button { width: 100%; margin-top: 12px; }.contact-admin { margin: 34px 0 0; color: #475467; font-size: 14px; line-height: 1.5; text-align: center; }.contact-admin a { margin-left: 6px; font-weight: 600; text-transform: capitalize; }
.login-footer { min-height: 60px; padding: 0 24px; display: flex; align-items: center; justify-content: center; gap: 24px; border-top: 1px solid #edf1f5; color: #667085; background: #fff; font-size: 13px; line-height: 1.5; }.login-footer a { color: #475467; }.login-footer i { font-style: normal; }

@media (max-width: 900px) {
  .login-card { min-height: calc(100vh - 60px); grid-template-columns: 1fr; }
  .login-story { display: none; }
  .login-form-panel { min-height: calc(100vh - 60px); padding: 26px 38px 32px; }
  .login-panel-header { justify-content: space-between; align-items: flex-start; }
  .mobile-login-logo { display: inline-flex; }
  .login-form-wrap { padding: 44px 0 30px; }
}

@media (max-width: 560px) {
  .login-card { min-height: 100vh; }
  .login-form-panel { min-height: 100vh; padding: 24px 20px 30px; }
  .login-panel-header { align-items: center; }.language-button span { display: none; }
  .login-form-wrap { padding: 48px 0 20px; }
  .login-heading { text-align: center; }.login-heading h2 { font-size: 28px; }.login-heading p { font-size: 14px; }
  .login-form { margin-top: 30px; }.form-field { margin-bottom: 20px; }.form-options { align-items: flex-start; }
  .provider-grid button { font-size: 0; gap: 0; }.provider-grid button > span { font-size: 21px; }
  .contact-admin { display: flex; flex-direction: column; gap: 5px; }.contact-admin a { margin: 0; }
  .login-footer { display: none; }
}

@media (max-height: 780px) and (min-width: 901px) {
  .login-card { min-height: 680px; }.story-benefits { margin-top: 28px; gap: 15px; }.login-form-wrap { padding: 20px 0; }.login-form { margin-top: 24px; }.form-field { margin-bottom: 16px; }.auth-divider { margin: 20px 0; }.contact-admin { margin-top: 22px; }
}
</style>
