<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from '@lucide/vue';

import BrandLogo from '../components/BrandLogo.vue';
import LoginStoryCarousel from '../components/login/LoginStoryCarousel.vue';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const passwordVisible = ref(false);
const rememberMe = ref(true);
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const submitting = ref(false);
const selectedDemoRole = ref('');

const demoPassword = import.meta.env.VITE_DEMO_USER_PASSWORD ?? 'Demo@FEPPM2026';
const demoAccounts = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', shortLabel: 'SA', email: 'superadmin@feppm.demo' },
  { role: 'NATIONAL_ADMIN', label: 'National Admin', shortLabel: 'NA', email: 'national.admin@feppm.demo' },
  { role: 'ZONAL_ADMIN', label: 'Zonal Admin', shortLabel: 'ZA', email: 'zonal.admin@feppm.demo' },
  { role: 'STATE_ADMIN', label: 'State Admin', shortLabel: 'STA', email: 'state.admin@feppm.demo' },
  { role: 'LGA_ADMIN', label: 'LGA Admin', shortLabel: 'LGA', email: 'lga.admin@feppm.demo' },
  { role: 'FACILITY_MANAGER', label: 'Facility Manager', shortLabel: 'FM', email: 'facility.manager@feppm.demo' },
];

function selectDemoAccount(account) {
  selectedDemoRole.value = account.role;
  email.value = account.email;
  password.value = demoPassword;
  errorMessage.value = '';
}

async function submitLogin() {
  errorMessage.value = '';
  submitting.value = true;

  try {
    await auth.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    });
    await router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/');
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <aside class="login-story">
        <LoginStoryCarousel />
        <BrandLogo inverse />
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

          <section class="demo-login" aria-labelledby="demo-login-title">
            <div class="demo-login-heading">
              <div>
                <h3 id="demo-login-title">Quick demo login</h3>
                <p>Select a role to prefill its test account.</p>
              </div>
              <span>Demo only</span>
            </div>

            <div class="demo-role-grid">
              <button
                v-for="account in demoAccounts"
                :key="account.role"
                class="demo-role-card"
                :class="{ selected: selectedDemoRole === account.role }"
                type="button"
                :aria-pressed="selectedDemoRole === account.role"
                :disabled="submitting"
                @click="selectDemoAccount(account)"
              >
                <span class="demo-role-mark">{{ account.shortLabel }}</span>
                <span class="demo-role-copy">
                  <strong>{{ account.label }}</strong>
                  <small>{{ account.email }}</small>
                </span>
                <span class="demo-role-check" aria-hidden="true">✓</span>
              </button>
            </div>
          </section>

          <form class="login-form" @submit.prevent="submitLogin">
            <p v-if="errorMessage" class="login-error" role="alert" aria-live="polite">{{ errorMessage }}</p>
            <label class="form-field">
              <span>Email address</span>
              <span class="input-wrap">
                <Mail :size="19" />
                <input v-model.trim="email" type="email" autocomplete="email" placeholder="Enter your email address" :disabled="submitting" required @input="selectedDemoRole = ''" />
              </span>
            </label>

            <label class="form-field">
              <span>Password</span>
              <span class="input-wrap">
                <LockKeyhole :size="19" />
                <input v-model="password" :type="passwordVisible ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" :disabled="submitting" required @input="selectedDemoRole = ''" />
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

            <button class="sign-in-button" type="submit" :disabled="submitting">
              <LockKeyhole :size="18" />
              {{ submitting ? 'Signing in…' : 'Sign in' }}
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
.login-story { position: relative; min-width: 0; padding: clamp(34px, 4vw, 62px) clamp(34px, 5vw, 78px) 38px; display: flex; flex-direction: column; overflow: hidden; color: #fff; background: #052d28; }
.login-story :deep(.feppm-logo) { position: relative; z-index: 3; }
.login-form-panel { min-width: 0; padding: clamp(28px, 3vw, 48px) clamp(40px, 6vw, 92px) 38px; display: flex; flex-direction: column; background: #fff; }
.login-panel-header { min-height: 42px; display: flex; justify-content: flex-end; align-items: flex-start; }
.mobile-login-logo { display: none; }
.language-button { height: 42px; padding: 0 14px; display: flex; align-items: center; gap: 8px; border: 1px solid #d8e0ea; border-radius: 9px; background: #fff; font-size: 14px; cursor: pointer; }
.login-form-wrap { width: min(500px, 100%); margin: auto; padding: 34px 0; }
.login-heading h2 { margin: 0; color: #101828; font-size: 32px; font-weight: 700; letter-spacing: -.02em; line-height: 1.25; text-transform: capitalize; }
.login-heading p { margin: 9px 0 0; color: #475467; font-size: 16px; line-height: 1.6; }
.demo-login { margin-top: 25px; padding: 15px; border: 1px solid #dce7f4; border-radius: 12px; background: #f8fbff; }
.demo-login-heading { margin-bottom: 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.demo-login-heading h3 { margin: 0; color: #163b65; font-size: 14px; font-weight: 700; line-height: 1.4; }
.demo-login-heading p { margin: 2px 0 0; color: #667085; font-size: 12px; line-height: 1.4; }
.demo-login-heading > span { padding: 4px 8px; flex: 0 0 auto; border-radius: 999px; color: #075e42; background: #dcfce7; font-size: 10px; font-weight: 700; letter-spacing: .04em; line-height: 1.3; text-transform: uppercase; }
.demo-role-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.demo-role-card { position: relative; min-width: 0; min-height: 52px; padding: 8px 25px 8px 8px; display: flex; align-items: center; gap: 9px; overflow: hidden; border: 1px solid #d7e1ed; border-radius: 9px; color: #344054; background: #fff; text-align: left; cursor: pointer; transition: border-color .18s, box-shadow .18s, transform .18s, background .18s; }
.demo-role-card:hover { border-color: #78aee9; background: #fafdff; transform: translateY(-1px); }
.demo-role-card:focus-visible { outline: 3px solid rgba(22,112,220,.2); outline-offset: 1px; }
.demo-role-card.selected { border-color: #1670dc; background: #eef6ff; box-shadow: 0 0 0 2px rgba(22,112,220,.1); }
.demo-role-card:disabled { cursor: wait; opacity: .65; transform: none; }
.demo-role-mark { width: 30px; height: 30px; display: grid; flex: 0 0 30px; place-items: center; border-radius: 8px; color: #1264c7; background: #e6f1ff; font-size: 10px; font-weight: 800; letter-spacing: -.02em; }
.demo-role-card.selected .demo-role-mark { color: #fff; background: #126bd3; }
.demo-role-copy { min-width: 0; display: block; }
.demo-role-copy strong, .demo-role-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.demo-role-copy strong { color: #1d2939; font-size: 11px; font-weight: 700; line-height: 1.35; }
.demo-role-copy small { margin-top: 2px; color: #667085; font-size: 9px; line-height: 1.3; }
.demo-role-check { position: absolute; top: 50%; right: 8px; width: 15px; height: 15px; display: grid; place-items: center; border-radius: 50%; color: transparent; background: #e6edf5; font-size: 10px; font-weight: 800; transform: translateY(-50%); }
.demo-role-card.selected .demo-role-check { color: #fff; background: #16a163; }
.login-form { margin-top: 24px; }
.login-error { margin: 0 0 18px; padding: 11px 13px; border: 1px solid #f4b4ad; border-radius: 8px; color: #b42318; background: #fff1f0; font-size: 13px; line-height: 1.5; }
.form-field { display: block; margin-bottom: 22px; }.form-field > span:first-child { display: block; margin-bottom: 9px; color: #101828; font-size: 15px; font-weight: 600; line-height: 1.5; text-transform: capitalize; }
.input-wrap { height: 50px; padding: 0 13px; display: flex; align-items: center; gap: 11px; border: 1px solid #d5dce6; border-radius: 8px; color: #667085; background: #fff; transition: border-color .2s, box-shadow .2s; }
.input-wrap:focus-within { border-color: #1670dc; box-shadow: 0 0 0 3px rgba(22,112,220,.12); }
.input-wrap input { min-width: 0; flex: 1; border: 0; outline: 0; color: #101828; background: transparent; font-size: 15px; line-height: 1.5; }.input-wrap input::placeholder { color: #98a2b3; }
.input-wrap button { width: 30px; height: 30px; padding: 0; display: grid; place-items: center; border: 0; color: #667085; background: transparent; cursor: pointer; }
.form-options { margin: -6px 0 26px; display: flex; justify-content: space-between; align-items: center; gap: 15px; font-size: 14px; line-height: 1.5; }
.remember-option { position: relative; display: flex; align-items: center; gap: 9px; cursor: pointer; }.remember-option input { position: absolute; opacity: 0; pointer-events: none; }.remember-option > span { width: 18px; height: 18px; display: grid; place-items: center; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; }.remember-option i { display: none; color: #fff; font-size: 12px; font-style: normal; font-weight: 700; }.remember-option input:checked + span { border-color: #1264d8; background: #1264d8; }.remember-option input:checked + span i { display: block; }
.form-options a { font-weight: 600; }
.sign-in-button { width: 100%; height: 52px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 8px; color: #fff; background: linear-gradient(100deg, #1160ca, #0874e4); box-shadow: 0 9px 18px rgba(18,100,216,.18); font-size: 16px; font-weight: 600; cursor: pointer; transition: transform .2s, box-shadow .2s; }.sign-in-button:hover { transform: translateY(-1px); box-shadow: 0 12px 23px rgba(18,100,216,.26); }
.sign-in-button:disabled { cursor: wait; opacity: .72; transform: none; box-shadow: none; }
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
  .demo-login { padding: 13px; text-align: left; }.demo-role-grid { grid-template-columns: 1fr; }
  .login-form { margin-top: 30px; }.form-field { margin-bottom: 20px; }.form-options { align-items: flex-start; }
  .provider-grid button { font-size: 0; gap: 0; }.provider-grid button > span { font-size: 21px; }
  .contact-admin { display: flex; flex-direction: column; gap: 5px; }.contact-admin a { margin: 0; }
  .login-footer { display: none; }
}

@media (max-height: 780px) and (min-width: 901px) {
  .login-card { min-height: 780px; }.login-form-wrap { padding: 20px 0; }.demo-login { margin-top: 18px; }.login-form { margin-top: 18px; }.form-field { margin-bottom: 14px; }.auth-divider { margin: 18px 0; }.contact-admin { margin-top: 20px; }
}
</style>
