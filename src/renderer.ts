/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 */

import { createApp } from 'vue';
import './index.css';
import App from './App.vue';

// 创建Vue应用实例并挂载到DOM
const app = createApp(App);
app.mount('#app');

