<template>
  <div class="routes-page">
    <Header :links="links" show-image />
    <h3 class="routes-page__title">
      Welcome back, <span class="primary">{{ profile?.Username || 'Reader' }}</span>!
    </h3>

    <div id="about" class="routes-page__description">
      Based on your reading preferences, we've handpicked routes just for you.<br>
      Explore stories that match your favorite genres, themes, and authors —
      and make your journey<br> truly your own.
    </div>

    <RouteOfTheMonth
      v-for="(item, i) in routeDisplayItems"
      :key="item.route.Id"
      background-color="#fff"
      :background-color-books="ROUTE_CONFIGS[i].booksColor"
      :books="item.books"
      :buttons="[{
        label: 'Start Your Route',
        color: ROUTE_CONFIGS[i].buttonColor,
        textColor: '#fff',
        action: () => startRoute(item.route.Id),
      }]"
      :subtitle="`Category: ${item.route.Category || 'No category'}`"
      :title="ROUTE_CONFIGS[i].title"
    />

    <div class="turn-the-page">
      <div class="layout">
        <div class="side1"><img alt="Side Left" src="/images/image_grid_1.webp"></div>
        <div class="top"><img alt="Top Image" src="/images/image_grid_2.webp"></div>
        <div class="side2"><img alt="Side Right" src="/images/image_grid_4.webp"></div>
        <div class="center"><img alt="Center Image" src="/images/image_grid_3.webp"></div>
      </div>
    </div>

    <RouteOfTheMonth
      v-if="monthlyRoute"
      id="route"
      background-color="#fff"
      background-color-books="#4A2B33"
      :books="routeBooks[monthlyRoute.Id] ?? []"
      :buttons="[{
        label: 'Start Your Route',
        color: '#d98b9c',
        textColor: '#fff',
        action: () => startRoute(monthlyRoute!.Id),
      }]"
      :subtitle="monthlyRoute.Description ?? ''"
      title="Route of the Month"
    />

    <RouteVoting />
    <Footer />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useModal } from '@/composables/useModal';
  import Header from '@/components/Header.vue';
  import Footer from '@/components/Footer.vue';
  import RouteOfTheMonth from '@/components/RouteOfTheMonth.vue';
  import RouteVoting from '@/components/RouteVoting.vue';
  import type { Book } from '@/types/general.interface';

  interface Route {
    Id: string;
    Name: string;
    Description: string | null;
    Category: string | null;
  }

  const ROUTE_CONFIGS = [
    { booksColor: '#4A2B33', buttonColor: '#D27487', title: '1. Most Read Genre-Based Route' },
    { booksColor: '#6F6F64', buttonColor: '#4A2B33', title: '2. Theme-Based Route' },
    { booksColor: '#D27487', buttonColor: '#6F6F64', title: '3. Combined Genre + Trope' },
  ] as const;

  const API = import.meta.env.VITE_API_URL;
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const token = localStorage.getItem('accessToken') || '';
  const headers = { Authorization: `Bearer ${token}` };

  const links = [
    { label: 'About', path: '#about' },
    { label: 'Route of the month', path: '#route' },
    { label: 'Voting', path: '#voting' },
  ];

  const { show } = useModal();

  const profile = ref<any>(null);
  const personalizedRoutes = ref<Route[]>([]);
  const monthlyRoute = ref<Route | null>(null);
  const routeBooks = ref<Record<string, Book[]>>({});

  const routeDisplayItems = computed(() =>
    personalizedRoutes.value.map(route => ({
      route,
      books: routeBooks.value[route.Id] ?? [],
    }))
  );

  const fetchBooks = async (routeId: string): Promise<Book[]> => {
    const res = await fetch(`${API}/routes/${routeId}/books`, { headers });
    const data = await res.json();
    return data.books.map((book: any) => ({
      ...book,
      CoverUrl: book.CoverUrl?.startsWith('/uploads') ? `${BASE_URL}${book.CoverUrl}` : book.CoverUrl,
      progressPercent: data.progressPercent ?? null,
    }));
  };

  onMounted(async () => {
    try {
      const [profData, routeData] = await Promise.all([
        fetch(`${API}/user/profile`, { headers }).then(r => r.json()),
        fetch(`${API}/routes/daily`, { headers }).then(r => r.json()),
      ]);

      profile.value = profData.user;
      personalizedRoutes.value = routeData.personalized.slice(0, 3);
      monthlyRoute.value = routeData.monthly ?? null;

      const allRouteIds = [
        ...personalizedRoutes.value.map(r => r.Id),
        ...(monthlyRoute.value ? [monthlyRoute.value.Id] : []),
      ];

      const results = await Promise.all(allRouteIds.map(id => fetchBooks(id)));
      routeBooks.value = Object.fromEntries(allRouteIds.map((id, i) => [id, results[i]]));
    } catch (error) {
      console.error('[routes.vue] Error loading data:', error);
    }
  });

  const startRoute = async (routeId: string) => {
    try {
      const res = await fetch(`${API}/routes/start/${routeId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start route');

      show('Your route has been started!', 'Route started', 'success');
    } catch (err) {
      console.error('[Route] Error starting route:', err);
      show('Something went wrong. Please try again.', 'Failed to start route', 'error');
    }
  };
</script>

<style scoped lang="scss">
.routes-page {
  text-align: center;

  &__title {
    font-size: 1.5rem;
    margin-top: 50px;
  }

  &__description {
    font-size: 1.1rem;
    line-height: 1.2;
    margin: 0 auto;
    padding: 80px 0 180px;
    background-color: #d9d9d9;
    font-family: 'Azeret Mono', sans-serif;
    font-weight: bold;
    color: rgb(var(--v-theme-black));
  }

  .turn-the-page {
    background-color: #d9d9d9;
    padding: 64px 0;

    .layout {
      max-width: 1328px;
      display: grid;
      grid-template-areas:
        "side1 top side2"
        "side1 center side2";
      grid-template-columns: 1fr 2fr 1fr;
      grid-template-rows: auto auto;
      gap: 60px;
      margin: auto;
    }

    .top { grid-area: top; }
    .center { grid-area: center; }
    .side1 { grid-area: side1; }
    .side2 { grid-area: side2; }

    .side1 img, .side2 img {
      max-height: 745px;
    }

    .layout img {
      width: 100%;
      height: auto;
      object-fit: cover;
      display: block;
      border-radius: 5px;
    }
  }
}
</style>
