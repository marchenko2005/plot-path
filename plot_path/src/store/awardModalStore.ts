import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Achievement {
  description: string
  image: string
}

export const useAwardModalStore = defineStore('awardModal', () => {
  const visible = ref(false)
  const achievement = ref<Achievement | null>(null)

  function show (ach: Achievement) {
    achievement.value = ach
    visible.value = true
  }

  function close () {
    visible.value = false
    achievement.value = null
  }

  return {
    visible,
    achievement,
    show,
    close,
  }
})
