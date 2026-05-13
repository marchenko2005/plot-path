<template>
  <div style="background: #f2eaea;">
    <ClubsToolbar breadcrumb />

    <div v-if="loaded" class="d-flex justify-center pa-6">
      <v-card
        class="pa-6 pa-sm-8"
        elevation="0"
        rounded="xl"
        style="width: 100%; max-width: 840px; background: #CF8A96;"
      >
        <template v-if="mode === 'create'">
          <h1 class="text-h5 font-weight-bold mb-1" style="color: #1e1012; line-height: 1.2;">
            Found a new club
          </h1>
          <p class="text-caption mb-6" style="color: #3a1e24;">
            Unite with like-minded readers around your favourite books — reading together is always better.
          </p>
        </template>
        <h1 v-else class="text-h5 font-weight-bold mb-6" style="color: #1e1012;">Edit club details</h1>

        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <p class="text-body-2 font-weight-bold mb-2" style="color: #1e1012;">Club Name</p>
            <v-text-field
              v-model="form.name"
              bg-color="white"
              density="compact"
              :error-messages="errors.name"
              rounded="lg"
              variant="solo"
              @input="errors.name = ''"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <p class="text-body-2 font-weight-bold mb-2" style="color: #1e1012;">Club Cover</p>
            <div
              class="rounded-lg"
              :style="`border: 2px dashed ${errors.cover ? '#b00020' : '#7B5B65'}; background: rgba(255,255,255,0.25); cursor: pointer; overflow: hidden;`"
              @click="triggerUpload"
            >
              <input
                ref="fileInput"
                accept="image/png,image/jpeg"
                hidden
                type="file"
                @change="onFileChange"
              >
              <v-img
                v-if="previewUrl || form.avatarUrl"
                cover
                :src="previewUrl || resolveUrl(form.avatarUrl)"
              />
              <div v-else class="d-flex align-center justify-center text-center text-caption" style="height: 52px;" :style="`color: ${errors.cover ? '#b00020' : '#5a3840'};`">
                <div>
                  <p>Click to upload</p>
                  <p>PNG, JPG · up to 5 MB</p>
                </div>
              </div>
            </div>
            <p v-if="errors.cover" class="text-caption mt-1" style="color: #b00020;">{{ errors.cover }}</p>
          </v-col>
        </v-row>

        <p class="text-body-2 font-weight-bold mb-2" style="color: #1e1012;">Club Description</p>
        <v-textarea
          v-model="form.description"
          bg-color="white"
          class="mb-4"
          density="compact"
          :error-messages="errors.description"
          placeholder="Tell us about your club: what you'll read, how often you meet, what topics you discuss..."
          rounded="lg"
          rows="3"
          variant="solo"
          @input="errors.description = ''"
        />

        <p class="text-body-2 font-weight-bold mb-2" style="color: #1e1012;">Club Genres</p>
        <v-card
          bg-color="white"
          class="pa-3 mb-4"
          elevation="0"
          rounded="lg"
          :style="errors.genres ? 'border: 1px solid #b00020;' : ''"
        >
          <p v-if="errors.genres" class="text-caption mb-2" style="color: #b00020;">{{ errors.genres }}</p>
          <div class="d-flex flex-wrap align-center ga-2">
            <v-chip
              v-for="tag in selectedTags"
              :key="tag.Id"
              closable
              color="#AA9E54"
              size="small"
              @click:close="removeTag(tag)"
            >
              {{ tag.Name }}
            </v-chip>
            <v-menu v-model="tagMenuOpen" :close-on-content-click="false">
              <template #activator="{ props }">
                <span class="text-caption" style="cursor: pointer; color: #7B5B65;" v-bind="props">Add more ...</span>
              </template>
              <v-card class="pa-2" elevation="4" min-width="240" rounded="lg">
                <v-text-field
                  v-model="tagSearch"
                  autofocus
                  class="mb-2"
                  density="compact"
                  hide-details
                  placeholder="Search genres..."
                  variant="outlined"
                  @input="filterTags"
                />
                <v-list density="compact" style="max-height: 200px; overflow-y: auto;">
                  <v-list-item
                    v-for="tag in filteredTags"
                    :key="tag.Id"
                    rounded="lg"
                    :title="tag.Name"
                    @click="addTag(tag)"
                  />
                  <v-list-item v-if="!filteredTags.length" disabled title="No genres found" />
                </v-list>
              </v-card>
            </v-menu>
          </div>
        </v-card>

        <p class="text-body-2 font-weight-bold mb-3" style="color: #1e1012;">Club Type</p>
        <v-row class="mb-6">
          <v-col cols="6">
            <v-card
              class="pa-4 text-center"
              :color="!form.isPublic ? '#4A2B33' : '#7B5B65'"
              elevation="0"
              rounded="lg"
              style="cursor: pointer;"
              @click="form.isPublic = false"
            >
              <v-icon class="mb-1" color="white">mdi-lock-outline</v-icon>
              <p class="text-body-2 font-weight-bold text-white">Private</p>
              <p class="text-caption text-white" style="opacity: 0.8;">Only the owner can share the invite link</p>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card
              class="pa-4 text-center"
              :color="form.isPublic ? '#4A2B33' : '#7B5B65'"
              elevation="0"
              rounded="lg"
              style="cursor: pointer;"
              @click="form.isPublic = true"
            >
              <v-icon class="mb-1" color="white">mdi-book-open-outline</v-icon>
              <p class="text-body-2 font-weight-bold text-white">Public</p>
              <p class="text-caption text-white" style="opacity: 0.8;">Any member can share the invite link</p>
            </v-card>
          </v-col>
        </v-row>

        <div class="d-flex ga-3 mb-4">
          <v-btn
            color="#2c1a1e"
            :disabled="submitting"
            :loading="submitting"
            rounded="lg"
            style="color: white;"
            @click="submit"
          >
            {{ mode === 'create' ? 'Create club' : 'Save' }}
          </v-btn>
          <v-btn
            v-if="mode === 'create'"
            color="#7B5B65"
            rounded="lg"
            style="color: white;"
            to="/clubs"
          >Cancel</v-btn>
          <v-btn
            v-else
            color="#7B5B65"
            rounded="lg"
            style="color: white;"
            @click="router.back()"
          >Cancel</v-btn>
        </div>

        <p v-if="mode === 'create'" class="text-caption" style="color: #3a1e24;">
          * A unique invite code will be generated automatically once the club is created
        </p>
      </v-card>
    </div>

    <div v-else class="d-flex justify-center align-center" style="height: 60vh;">
      <v-progress-circular color="white" indeterminate />
    </div>

    <p class="text-center text-caption py-4" style="color: rgba(255,255,255,0.6);">© 2025 PlotPath All Rights Reserved</p>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { apiFetch } from '@/plugins/api';

  interface Tag { Id: string; Name: string; Type: string }

  const props = defineProps<{ mode: 'create' | 'edit'; clubId?: string }>();

  const router = useRouter();
  const submitting = ref(false);
  const loaded = ref(false);
  const fileInput = ref<HTMLInputElement | null>(null);
  const pendingFile = ref<File | null>(null);
  const previewUrl = ref<string | null>(null);

  const form = ref({
    name: '',
    description: '',
    avatarUrl: null as string | null,
    isPublic: false,
  });

  const errors = ref({ name: '', cover: '', description: '', genres: '' });

  const allTags = ref<Tag[]>([]);
  const selectedTags = ref<Tag[]>([]);
  const tagSearch = ref('');
  const tagMenuOpen = ref(false);
  const filteredTags = ref<Tag[]>([]);

  function resolveUrl (url: string | null): string {
    if (!url) return '';
    if (url.startsWith('/uploads')) return `${(import.meta.env.VITE_API_URL as string).replace('/api', '')}${url}`;
    return url;
  }

  function triggerUpload () {
    fileInput.value?.click();
  }

  function onFileChange (e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    pendingFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    errors.value.cover = '';
  }

  function filterTags () {
    const q = tagSearch.value.toLowerCase();
    const selectedIds = new Set(selectedTags.value.map(t => t.Id));
    filteredTags.value = allTags.value.filter(
      t => !selectedIds.has(t.Id) && (!q || t.Name.toLowerCase().includes(q)),
    );
  }

  function addTag (tag: Tag) {
    if (!selectedTags.value.find(t => t.Id === tag.Id)) selectedTags.value.push(tag);
    tagSearch.value = '';
    tagMenuOpen.value = false;
    filterTags();
    errors.value.genres = '';
  }

  function removeTag (tag: Tag) {
    selectedTags.value = selectedTags.value.filter(t => t.Id !== tag.Id);
    filterTags();
  }

  function validate (): boolean {
    errors.value = { name: '', cover: '', description: '', genres: '' };
    let valid = true;
    if (!form.value.name.trim()) { errors.value.name = 'Club name is required'; valid = false; }
    if (props.mode === 'create' && !pendingFile.value) { errors.value.cover = 'Club cover is required'; valid = false; }
    if (!form.value.description.trim()) { errors.value.description = 'Description is required'; valid = false; }
    if (selectedTags.value.length === 0) { errors.value.genres = 'At least one genre is required'; valid = false; }
    return valid;
  }

  async function submit () {
    if (!validate()) return;
    submitting.value = true;
    try {
      if (pendingFile.value) {
        const fd = new FormData();
        fd.append('image', pendingFile.value);
        const { imageUrl } = await apiFetch('/upload', { method: 'POST', body: fd }) as { imageUrl: string };
        form.value.avatarUrl = imageUrl;
      }

      const payload = {
        name: form.value.name,
        description: form.value.description,
        avatarUrl: form.value.avatarUrl,
        isPublic: form.value.isPublic,
        tagIds: selectedTags.value.map(t => t.Id),
      };

      if (props.mode === 'create') {
        const data = await apiFetch('/clubs', { method: 'POST', body: JSON.stringify(payload) }) as { id: string };
        router.push(`/clubs/${data.id}`);
      } else {
        await apiFetch(`/clubs/${props.clubId}`, { method: 'PUT', body: JSON.stringify(payload) });
        router.push(`/clubs/${props.clubId}`);
      }
    } catch (err) {
      console.error(`[ClubFormPage] ${props.mode} error:`, err);
    } finally {
      submitting.value = false;
    }
  }

  onMounted(async () => {
    try {
      if (props.mode === 'edit' && props.clubId) {
        const [clubData, genreTags] = await Promise.all([
          apiFetch(`/clubs/${props.clubId}`) as Promise<any>,
          apiFetch('/tags/type/Genre') as Promise<Tag[]>,
        ]);
        form.value.name = clubData.Name;
        form.value.description = clubData.Description || '';
        form.value.avatarUrl = clubData.AvatarUrl;
        form.value.isPublic = !!clubData.IsPublic;
        selectedTags.value = clubData.tags || [];
        allTags.value = genreTags;
      } else {
        allTags.value = await apiFetch('/tags/type/Genre') as Tag[];
      }

      filterTags();
      loaded.value = true;
    } catch (err) {
      console.error('[ClubFormPage] init error:', err);
    }
  });
</script>
