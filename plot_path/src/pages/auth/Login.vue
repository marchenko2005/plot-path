<template>
  <div class="login-page">
    <v-container class=" container">
      <v-row class="login-wrapper" no-gutters>
        <!-- Left section -->
        <v-col class="login-form-section" cols="12" md="6">
          <div class="form-content">
            <img alt="logo" class="logo" src="/logo.svg">
            <h2 class="form-title">Welcome Back</h2>
            <p class="form-subtitle">
              Your next chapter is waiting. The story continues — and you're the hero.
              Sign in to pick up your journey and unlock new achievements.
            </p>

            <v-form>
              <BaseFormGroup label="Email">
                <v-text-field
                  v-model="email"
                  class="input"
                  density="comfortable"
                  hide-details
                  placeholder="Example@email.com"
                  type="email"
                  variant="solo"
                />
              </BaseFormGroup>
              <BaseFormGroup label="Password">
                <v-text-field
                  v-model="password"
                  class="input"
                  density="comfortable"
                  placeholder="At least 8 characters"
                  type="password"
                  variant="solo"
                />
              </BaseFormGroup>

              <v-alert
                v-if="error"
                class="mb-3"
                density="compact"
                :text="error"
                type="error"
                variant="tonal"
              />

              <v-btn
                block
                class="login-button"
                :loading="loading"
                size="large"
                @click="submit"
              >
                Sign in
              </v-btn>
            </v-form>

            <p class="signup-prompt">
              Don’t you have an account?
              <router-link class="signup-link" to="/auth/signup">Sign up</router-link>
            </p>
          </div>
        </v-col>

        <!-- Right section -->
        <v-col class="login-image-section" cols="12" md="6">
          <img
            class="login-image"
            :src="image"
          >
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
  import BaseFormGroup from '@/components/Base/BaseFormGroup.vue';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/store/auth';

  const router = useRouter();
  const authStore = useAuthStore();

  const email = ref('');
  const password = ref('');
  const image = '/images/auth.webp';
  const loading = ref(false);
  const error = ref('');

  const submit = async () => {
    loading.value = true;
    error.value = '';
    try {
      await authStore.login(email.value, password.value);
      router.push('/routes');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
    } finally {
      loading.value = false;
    }
  };
</script>


<style scoped lang="scss">
.login-page {
  background-color: #f3f3ed;
  min-height: 100vh;
  display: flex;
  align-items: center;

  .logo {
    margin: 0 auto;
    display: block;
  }

  .login-wrapper {
    width: 100%;
    margin: 0 auto;
    border-radius: 8px;
    overflow: hidden;
  }

  .login-form-section {
    padding: 3rem 2rem;
    display: flex;
    align-items: center;

    .form-content {
      max-width: 440px;
      width: 100%;
      padding: 0 5px;

      .form-title {
        font-size: 1.8rem;
        font-weight: bold;
        margin-top: 0;
        margin-bottom: 0.5rem;
        color: #2e2e2e;
        text-align: center;
      }

      .form-subtitle {
        font-size: 0.95rem;
        margin-bottom: 2rem;
        color: #555;
      }

      .input {
        margin-bottom: 1.2rem;
      }

      .login-button {
        background-color: #5a574d;
        color: white;
        border-radius: 8px;
        text-transform: none;
        font-weight: 500;
        margin-top: 0.5rem;
      }

      .signup-prompt {
        font-size: 0.85rem;
        margin-top: 1.5rem;
        text-align: center;
        color: #444;

        .signup-link {
          color: #3b2a2a;
          font-weight: 500;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  .login-image-section {
    display: none;

    @media (min-width: 960px) {
      display: flex;
      justify-content: flex-end;
    }

    .login-image {
      width: 100%;
      height: 100%;
      max-height: 90vh;
      max-width: 600px;
    }
  }
}
</style>
