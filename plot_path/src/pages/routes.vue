<template>
  <div class="routes-page">
    <Header :links="links" show-image />
    <h3 class="routes-page__title">
      Welcome back, <span class="primary">{{ profile?.Username || 'Reader' }}</span>!
    </h3>

    <div id="about" class="routes-page__description">
      Based on your reading preferences, we’ve handpicked routes just for you.<br>
      Explore stories that match your favorite genres, themes, and authors —
      and make your journey<br> truly your own.
    </div>

    <RouteOfTheMonth
      v-if="personalizedRoutes.length >= 1"
      background-color="#fff"
      background-color-books="#4A2B33"
      :books="books1"
      :buttons="[{
        label: 'Start Your Route',
        color: '#D27487',
        textColor: '#fff',
        action: () => startRoute(personalizedRoutes[0].Id)
      }]"
      :subtitle="getRouteInfo(personalizedRoutes[0])"
      title="1. Most Read Genre-Based Route"
    />

    <RouteOfTheMonth
      v-if="personalizedRoutes.length >= 2"
      background-color="#fff"
      background-color-books="#6F6F64"
      :books="books2"
      :buttons="[{
        label: 'Start Your Route',
        color: '#4A2B33',
        textColor: '#fff',
        action: () => startRoute(personalizedRoutes[1].Id)
      }]"
      :subtitle="getRouteInfo(personalizedRoutes[1])"
      title="2 Theme-Based Route "
    />

    <RouteOfTheMonth
      v-if="personalizedRoutes.length >= 3"
      background-color="#fff"
      background-color-books="#D27487"
      :books="books3"
      :buttons="[{
        label: 'Start Your Route',
        color: '#6F6F64',
        textColor: '#fff',
        action: () => startRoute(personalizedRoutes[2].Id)
      }]"
      :subtitle="getRouteInfo(personalizedRoutes[2])"
      title="3. Combined Genre + Trope."
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
      :books="books4"
      :buttons="[{
        label: 'Start Your Route',
        color: '#d98b9c',
        textColor: '#fff',
        action: () => startRoute(monthlyRoute.Id)
      }]"
      :subtitle="monthlyRoute.Description"
      title="Route of the Month"
    />

    <RouteVoting />
    <Footer />
  </div>
</template><script setup lang="ts">
  import { ref, onMounted } from 'vue';
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

  const profile = ref<any>(null);
  const personalizedRoutes = ref<Route[]>([]);
  const monthlyRoute = ref<Route | null>(null);

  const books1 = ref<Book[]>([]);
  const books2 = ref<Book[]>([]);
  const books3 = ref<Book[]>([]);
  const books4 = ref<Book[]>([]);

  const API = 'http://localhost:3000/api';
  const token = localStorage.getItem('accessToken') || '';

  const links = [
    { label: 'About', path: '#about' },
    { label: 'Route of the month', path: '#route' },
    { label: 'Voting', path: '#voting' },
  ];

  onMounted(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      console.log('[routes.vue] Fetching profile...');
      const profRes = await fetch(`${API}/user/profile`, { headers });
      const profData = await profRes.json();
      console.log('[routes.vue] Profile loaded:', profData);
      profile.value = profData.user;

      console.log('[routes.vue] Fetching daily routes...');
      const routeRes = await fetch(`${API}/routes/daily`, { headers });
      const routeData = await routeRes.json();
      console.log('[routes.vue] Routes loaded:', routeData);

      // Просто беремо перші три персоналізовані маршрути в порядку, як повернув сервер
      personalizedRoutes.value = routeData.personalized.slice(0, 3);
      monthlyRoute.value = routeData.monthly || null;

      // Підвантажуємо книги для кожного маршруту
      if (personalizedRoutes.value[0]) {
        console.log('[routes.vue] Fetching books for route 1...');
        books1.value = await fetchBooks(personalizedRoutes.value[0].Id);
      }

      if (personalizedRoutes.value[1]) {
        console.log('[routes.vue] Fetching books for route 2...');
        books2.value = await fetchBooks(personalizedRoutes.value[1].Id);
      }

      if (personalizedRoutes.value[2]) {
        console.log('[routes.vue] Fetching books for route 3...');
        books3.value = await fetchBooks(personalizedRoutes.value[2].Id);
      }

      if (monthlyRoute.value) {
        console.log('[routes.vue] Fetching books for monthly route...');
        books4.value = await fetchBooks(monthlyRoute.value.Id);
      }

    } catch (error) {
      console.error('[routes.vue] Error loading data:', error);
    }
  });

  const fetchBooks = async (routeId: string): Promise<Book[]> => {
    const res = await fetch(`${API}/routes/${routeId}/books`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    return data.books.map((book: any) => {
      const fullCoverUrl = book.CoverUrl?.startsWith('/uploads')
        ? `http://localhost:3001${book.CoverUrl}`
        : book.CoverUrl;

      return {
        ...book,
        CoverUrl: fullCoverUrl,
        progressPercent: data.progressPercent || null,
      };
    });
  };

  const startRoute = async (routeId: string) => {
    console.log(`[Route] Start clicked for: ${routeId}`);
    try {
      const res = await fetch(`${API}/routes/start/${routeId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to start route');

      console.log('[Route] Route started:', data.message);
      // Можна оновити інтерфейс, перенаправити користувача або показати сповіщення
      alert('Route started successfully!');
    } catch (err) {
      console.error('[Route] Error starting route:', err);
      alert('Failed to start route');
    }
  };

  const getRouteInfo = (route: Route) => {
    return `Category: ${route.Category || 'No category'}`;
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
