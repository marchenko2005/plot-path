/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#D27487',
          secondary: '#4A2B33',
          white: '#FFFFFF',
          black: '#000000',
          gray: '#E9E9E3',
          'dark-gray': '#6F6F64',
          yellow: '#AA9E54',
          'dark-yellow': '#6F6F64',
        },
      },
    },
  },
})
