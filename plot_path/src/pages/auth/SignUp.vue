<template>
  <div class="signup-container">
    <v-container class="container">
      <v-card class="signup-card" flat>
        <!-- Left side -->
        <div class="left-panel">
          <img class="logo" src="/images/icons/logo.svg">
          <p class="tagline">
            Your journey begins here. Join PlotPath and explore <br> book routes,
            earn badges, and unlock new stories.
          </p>
          <img
            class="signup-image"
            src="/public/images/sign_up.webp"
          >
        </div>

        <!-- Right side -->
        <div class="right-panel">
          <h2 class="form-title">Create your account with us below</h2>
          <p class="login-prompt">
            Already have an account?
            <router-link to="/auth/login">Log in</router-link>
          </p>

          <v-form ref="formRef" class="form-fields" @submit.prevent="submitForm">
            <BaseFormGroup label="Full Name">
              <v-text-field
                v-model="form.fullName"
                color="primary"
                :error="!!errors.fullName"
                :error-messages="errors.fullName"
                hide-details="auto"
                placeholder="Enter your full name"
                variant="outlined"
              />
            </BaseFormGroup>
            <BaseFormGroup label="Email Address">
              <v-text-field
                v-model="form.email"
                color="primary"
                hide-details="auto"
                placeholder="Enter your email address"
                type="email"
                variant="outlined"
              />
            </BaseFormGroup>
            <BaseFormGroup label="Password">
              <v-text-field
                v-model="form.password"
                :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                color="primary"
                hide-details="auto"
                placeholder="Create a password"
                :type="showPass ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPass = !showPass"
              />
            </BaseFormGroup>
            <BaseFormGroup label="Repeat Password">
              <v-text-field
                v-model="form.passwordRepeat"
                :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                color="primary"
                hide-details="auto"
                placeholder="Repeat a password"
                :type="showPass ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPass = !showPass"
              />
            </BaseFormGroup>
            <BaseFormGroup label="Select your Interests">
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
                placeholder="Search here..."
                variant="outlined"
                @update:search="searchTags"
              />

            </BaseFormGroup>

            <v-btn block class="create-btn mt-6" size="large" type="submit">
              Create Account
            </v-btn>
          </v-form>
        </div>
      </v-card>
    </v-container>
  </div>

</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue';

  const API = 'http://localhost:3000/api';
  const interests = ref<{ Id: string; Name: string }[]>([]); // усі доступні теги
  const form = reactive({
    fullName: '',
    email: '',
    password: '',
    passwordRepeat: '',
    interests: [] as string[], // Масив лише ID
  });

  const showPass = ref(false);
  const errors = reactive<{ fullName?: string }>({});
  const formRef = ref();

  // Пошук тегів за частиною назви
  const searchTags = async (query: string) => {
    if (!query || query.length < 2) return;
    try {
      const res = await fetch(`${API}/tags/search/by-name?name=${encodeURIComponent(query)}`);
      const data = await res.json();
      const existing = new Set(interests.value.map(tag => tag.Id));
      for (const tag of data) {
        if (!existing.has(tag.Id)) interests.value.push(tag);
      }
    } catch (err) {
      console.error('[SignUp] searchTags error:', err);
    }
  };

  // Відправка реєстрації
  const submitForm = async () => {
    errors.fullName = form.fullName.trim() === '' ? 'Full name is required' : '';
    if (errors.fullName) return;

    const tagIds = form.interests.filter(id => !!id); // вже ID
    console.log('[SignUp] Selected interests:', form.interests);
    console.log('[SignUp] Final tagIds:', tagIds);

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          password: form.password,
          tagIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      console.log('[SignUp] User registered:', data);
      // Optionally redirect to login
    } catch (err) {
      console.error('[SignUp] Registration error:', err);
    }
  };

</script>

<style lang="scss" scoped>
.signup-container {
  background-color: #f3f3ed;
  height: 100vh;

  .signup-card {
    display: flex;
    //align-items: center;
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
