import { createPinia } from 'pinia';
import { createApp } from 'vue';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';

import App from './App.vue';
import router from './router/index.js';
import './assets/main.css';

createApp(App).use(createPinia()).use(router).mount('#app');
