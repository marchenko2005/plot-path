<template>
  <div class="signup-container">
    <v-container class="container">
      <v-card class="signup-card" flat>
        <!-- Left side -->
        <div class="left-panel">
          <img class="logo" src="/images/icons/logo.svg">
          <p class="tagline">{{ t('signup.tagline') }}</p>
          <img
            class="signup-image"
            src="/public/images/sign_up.webp"
          >
        </div>

        <!-- Right side -->
        <div class="right-panel">
          <h2 class="form-title">{{ t('signup.title') }}</h2>
          <p class="login-prompt">
            {{ t('signup.haveAccount') }}
            <router-link to="/auth/login">{{ t('signup.logIn') }}</router-link>
          </p>

          <v-form ref="formRef" class="form-fields" @submit.prevent="submitForm">
            <BaseFormGroup :label="t('signup.fullName')">
              <v-text-field
                v-model="form.fullName"
                color="primary"
                :error="!!errors.fullName"
                :error-messages="errors.fullName"
                hide-details="auto"
                :placeholder="t('signup.namePlaceholder')"
                variant="outlined"
              />
            </BaseFormGroup>
            <BaseFormGroup :label="t('signup.emailAddress')">
              <v-text-field
                v-model="form.email"
                color="primary"
                hide-details="auto"
                :placeholder="t('signup.emailPlaceholder')"
                type="email"
                variant="outlined"
              />
            </BaseFormGroup>
            <BaseFormGroup :label="t('signup.password')">
              <v-text-field
                v-model="form.password"
                :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                color="primary"
                hide-details="auto"
                :placeholder="t('signup.passwordPlaceholder')"
                :type="showPass ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPass = !showPass"
              />
            </BaseFormGroup>
            <BaseFormGroup :label="t('signup.repeatPassword')">
              <v-text-field
                v-model="form.passwordRepeat"
                :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                color="primary"
                hide-details="auto"
                :placeholder="t('signup.repeatPasswordPlaceholder')"
                :type="showPass ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPass = !showPass"
              />
            </BaseFormGroup>
            <BaseFormGroup :label="t('signup.interests')">
              <v-autocomplete
                v-model="form.interests"
                chips
                closable-chips
                color="primary"
                hide-details="auto"
                item-title="Name"
                item-value="Id"
                :items="interests"
                multiple
                :placeholder="t('signup.searchPlaceholder')"
                variant="outlined"
                @update:search="searchTags"
              />
            </BaseFormGroup>

            <v-alert
              v-if="errors.server"
              class="mt-2"
              density="compact"
              :text="errors.server"
              type="error"
              variant="tonal"
            />

            <v-btn block class="create-btn mt-6" size="large" type="submit">
              {{ t('signup.createAccount') }}
            </v-btn>
          </v-form>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { apiFetch } from '@/plugins/api';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const interests = ref<{ Id: string; Name: string }[]>([]);
const form = reactive({
  fullName: '',
  email: '',
  password: '',
  passwordRepeat: '',
  interests: [] as string[],
});

const showPass = ref(false);
const errors = reactive<{ fullName?: string; server?: string }>({});

onMounted(async () => {
  try {
    const data = await apiFetch('/tags') as { Id: string; Name: string }[];
    interests.value = data;
  } catch (err) {
    console.error('[SignUp] Failed to load tags:', err);
  }
});

const searchTags = async (query: string) => {
  if (!query || query.length < 2) return;
  try {
    const data = await apiFetch(`/tags/search/by-name?name=${encodeURIComponent(query)}`) as { Id: string; Name: string }[];
    const existing = new Set(interests.value.map(tag => tag.Id));
    for (const tag of data) {
      if (!existing.has(tag.Id)) interests.value.push(tag);
    }
  } catch (err) {
    console.error('[SignUp] searchTags error:', err);
  }
};

const submitForm = async () => {
  errors.fullName = form.fullName.trim() === '' ? t('signup.nameRequired') : '';
  errors.server = '';
  if (errors.fullName) return;

  const tagIds = form.interests.filter(Boolean);

  try {
    await authStore.register(form.fullName, form.email, form.password, tagIds);
    router.push('/auth/login');
  } catch (err) {
    console.error('[SignUp] Registration error:', err);
    errors.server = err instanceof Error ? err.message : t('signup.registrationFailed');
  }
};
</script>

<style lang="scss" scoped>
.signup-container {
  background-color: #f3f3ed;
  height: 100vh;

  .signup-card {
    display: flex;
    margin: 0 auto;
    height: calc(100vh - 36px);
    background-color: transparent;

    .left-panel {
      flex: 1;
      background: rgb(var(--v-theme-secondary));
      color: #fff;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      max-width: 600px;
      border-radius: 8px;

      .logo {
        max-width: 243px;
        margin: 50px auto 0;
      }

      .tagline {
        font-size: 18px;
        text-align: center;
      }

      .signup-image {
        width: 100%;
        border-radius: 8px;
      }
    }

    .right-panel {
      flex: 1;
      background-color: #f3f3ed;
      padding: 2rem 0 2rem 80px;
      margin: auto 0;

      .form-title {
        font-size: 32px;
        font-weight: 600;
        color: #000;
        margin-bottom: 0.5rem;
      }

      .login-prompt {
        font-size: 1rem;
        margin-bottom: 1.5rem;

        a {
          font-weight: 500;
          color: #3b2a2a;
          text-decoration: underline;
        }
      }

      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .create-btn {
          background: rgb(var(--v-theme-primary));
          color: #fff;
          text-transform: none;
          font-weight: 600;

          &:hover {
            background-color: #a05e68;
          }
        }
      }
    }
  }
}
</style>
