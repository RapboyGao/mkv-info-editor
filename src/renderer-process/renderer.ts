/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import './index.css';
import App from './App.vue';
import router from './router';

// 创建Vue应用实例
const app = createApp(App);

// 创建并使用Pinia
const pinia = createPinia();
app.use(pinia);

// 使用ElementPlus
app.use(ElementPlus);

// 使用router
app.use(router);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 挂载到DOM
app.mount('#app');


