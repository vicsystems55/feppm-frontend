<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from '@lucide/vue';

import BrandLogo from '../components/BrandLogo.vue';
import LanguageSwitcher from '../components/i18n/LanguageSwitcher.vue';
import LoginStoryCarousel from '../components/login/LoginStoryCarousel.vue';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const passwordVisible = ref(false);
const rememberMe = ref(true);
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const submitting = ref(false);

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
          <LanguageSwitcher />
        </header>

        <div class="login-form-wrap">
          <div class="login-heading">
            <h2>{{ t('login.welcome') }}</h2>
            <p>{{ t('login.subtitle') }}</p>
          </div>

          <form class="login-form" @submit.prevent="submitLogin">
            <p v-if="errorMessage" class="login-error" role="alert" aria-live="polite">{{ errorMessage }}</p>
            <label class="form-field">
              <span>{{ t('login.email') }}</span>
              <span class="input-wrap">
                <Mail :size="19" />
                <input v-model.trim="email" type="email" autocomplete="email" :placeholder="t('login.emailPlaceholder')" :disabled="submitting" required />
              </span>
            </label>

            <label class="form-field">
              <span>{{ t('login.password') }}</span>
              <span class="input-wrap">
                <LockKeyhole :size="19" />
                <input v-model="password" :type="passwordVisible ? 'text' : 'password'" autocomplete="current-password" :placeholder="t('login.passwordPlaceholder')" :disabled="submitting" required />
                <button type="button" :aria-label="passwordVisible ? t('login.hidePassword') : t('login.showPassword')" @click="passwordVisible = !passwordVisible">
                  <EyeOff v-if="passwordVisible" :size="19" />
                  <Eye v-else :size="19" />
                </button>
              </span>
            </label>

            <div class="form-options">
              <label class="remember-option">
                <input v-model="rememberMe" type="checkbox" />
                <span><i>✓</i></span>
                {{ t('login.rememberMe') }}
              </label>
              <a href="#" @click.prevent>{{ t('login.forgotPassword') }}</a>
            </div>

            <button class="sign-in-button" type="submit" :disabled="submitting">
              <LockKeyhole :size="18" />
              {{ submitting ? t('login.signingIn') : t('login.signIn') }}
            </button>

            <div class="auth-divider"><span>{{ t('login.continueWith') }}</span></div>

            <div class="provider-grid">
              <button type="button"><span class="google-mark">G</span>Google</button>
              <button type="button"><span class="microsoft-mark"><i /><i /><i /><i /></span>Microsoft</button>
            </div>

            <button class="sso-button" type="button"><ShieldCheck :size="19" />{{ t('login.ssoLogin') }}</button>
          </form>

          <p class="contact-admin">{{ t('login.noAccount') }} <a href="mailto:admin@feppm.com">{{ t('login.contactAdministrator') }}</a></p>
        </div>
      </section>
    </section>

    <footer class="login-footer">
      <span>{{ t('login.copyright') }}</span>
      <a href="#" @click.prevent>{{ t('login.privacyPolicy') }}</a><i>•</i><a href="#" @click.prevent>{{ t('login.termsOfService') }}</a>
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
.sso-button { width: 100%; margin-top: 12px; }.contact-admin { margin: 34px 0 0; color: #475467; font-size: 14px; line-height: 1.5; text-align: center; }.contact-admin a { margin-inline-start: 6px; font-weight: 600; text-transform: capitalize; }
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
  .login-card { min-height: 780px; }.login-form-wrap { padding: 20px 0; }.login-form { margin-top: 18px; }.form-field { margin-bottom: 14px; }.auth-divider { margin: 18px 0; }.contact-admin { margin-top: 20px; }
}
</style>
