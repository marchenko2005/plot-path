import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Achievement {
  description: string
  image: string
}

export const useAwardModalStore = defineStore('awardModal', () => {
  const visible = ref(false)
  const achievement = ref<Achievement | null>(null)
  const queue = ref<Achievement[]>([])

  function show (ach: Achievement) {
    if (visible.value) {
      queue.value.push(ach)
    } else {
      achievement.value = ach
      visible.value = true
    }
  }

  function close () {
    visible.value = false
    achievement.value = null
    if (queue.value.length > 0) {
      const next = queue.value.shift()!
      setTimeout(() => {
        achievement.value = next
        visible.value = true
      }, 300)
    }
  }

  return {
    visible,
    achievement,
    show,
    close,
  }
})
