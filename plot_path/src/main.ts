/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Styles
import './styles/main.scss'

const pinia = createPinia()
const app = createApp(App)

registerPlugins(app)
app.use(pinia)

app.mount('#app')
