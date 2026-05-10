<template>
  <div>
    <Header :links show-image />
    <AboutUs />
    <RouteOfTheMonth
      id="route"
      background-color="#E9E9E3"
      background-color-books="#4A2B33"
      :books="books"
      :buttons="[
        { label: t('home.startRoute'), color: '#d98b9c', textColor: '#fff', action: startRoute },
        { label: t('home.exploreAwards'), color: '#4A2B33', textColor: '#fff', action: exploreAwards }
      ]"
      :subtitle="subtitle"
      :title="t('home.routeOfMonth')"
    />
    <AwardsShowcase />
    <LibraryGallery />
    <Footer />
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import type { Book } from '@/types/general.interface';

  const { t } = useI18n();

  const API = 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken') || '';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const router = useRouter();
  const links = computed(() => [
    { label: t('header.links.about'), path: '#about' },
    { label: t('header.links.routeOfMonth'), path: '#route' },
  ]);

  const books = ref<Book[]>([]);
  const subtitle = ref('Dystopian Books'); // fallback значення

  const fetchBooks = async (routeId: string): Promise<Book[]> => {
    try {
      console.log('[fetchBooks] Fetching books for route:', routeId);
      const res = await fetch(`${API}/routes/${routeId}/books`, { headers });

      if (!res.ok) {
        console.warn('[fetchBooks] Failed request. Status:', res.status);
        return [];
      }

      const data = await res.json();
      console.log('[fetchBooks] Raw data:', data);

      return data.books.map((book: any) => {
        const fullCoverUrl = book.CoverUrl?.startsWith('/uploads')
          ? `http://localhost:3000${book.CoverUrl}`
          : book.CoverUrl;

        console.log('[fetchBooks] Final cover URL:', fullCoverUrl);

        return {
          Id: book.Id,
          Title: book.Title,
          CoverUrl: fullCoverUrl,
        };
      });
    } catch (err) {
      console.error('[fetchBooks] Error loading books:', err);
      return [];
    }
  };


  const fetchMonthlyRoute = async () => {
    try {
      const res = await fetch(`${API}/routes/monthly`, { headers });
      const route = await res.json();
      console.log('[Monthly Route]', route);

      subtitle.value = route.Description || route.Name || 'Route of the Month';
      books.value = await fetchBooks(route.Id);
    } catch (err) {
      console.error('[HomePage] Failed to load monthly route:', err);
    }
  };

  onMounted(() => {
    fetchMonthlyRoute();
  });

  function startRoute () {
    router.push('/auth/signup');
  }

  function exploreAwards () {
    router.push('/awards');
  }

</script>
