import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from 'src/services'
import type { User } from 'src/services/api'
import Storage from 'src/utils/storage'

export let userStorage = new Storage<User>('user')

export let isAuthorized = (): boolean => !!userStorage.get()

export let useUserStore = defineStore('user', () => {
  let user = ref(userStorage.get())
  let isAuthorized = computed(() => !!user.value)

  function updateUser(userData?: User | null) {
    if (userData) {
      userStorage.set(userData)
      api.setSecurityData(userData.token)
      user.value = userData
    }
    else {
      userStorage.remove()
      api.setSecurityData(null)
      user.value = null
    }
  }

  return {
    user,
    isAuthorized,
    updateUser,
  }
})
