<template>
  <section class="route-section" :style="{ backgroundColor: backgroundColor }">
    <v-container>
      <h2 class="route-title">{{ title }}</h2>
      <h3 v-if="subtitle" class="route-subtitle" v-html="subtitle" />

      <v-sheet class="carousel-container" rounded="xl" :style="{ backgroundColor: backgroundColorBooks }">
        <div class="books">
          <v-img
            v-for="(book, index) in books"
            :key="index"
            class="book-cover"
            cover
            :src="`${book.CoverUrl}`"
            @click="() => openBook(book.RouteId, book.Id)"
          />
        </div>

        <div v-if="books.length > 1" class="progress-bar">
          <div class="progress-fill" :style="{ width: `${fillPercent}%`, backgroundColor: accentColor }" />
          <div
            v-for="(_, index) in books"
            :key="'dot-' + index"
            class="progress-dot"
            :class="{
              'dot-completed': index < currentBookIndex,
              'dot-active': index === currentBookIndex,
              'dot-empty': index > currentBookIndex,
            }"
            :style="{
              left: `${(index / (books.length - 1)) * 100}%`,
              backgroundColor: index <= currentBookIndex ? accentColor : 'white',
              borderColor: accentColor,
            }"
          />
        </div>
      </v-sheet>
      <div class="actions">
        <v-btn
          v-for="(button, index) in buttons"
          :key="index"
          block
          class="action-btn"
          size="x-large"
          :style="{ backgroundColor: button.color, color: button.textColor }"
          @click="button.action"
        >
          {{ button.label }}
        </v-btn>
      </div>
    </v-container>
  </section>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import type { Book } from '@/types/general.interface';
  import { useRouter } from 'vue-router';

  const router = useRouter();

  const openBook = (routeId: string, bookId: string) => {
    router.push({
      path: `/books/${routeId}/${bookId}`,
      query: { routeId },
    });
  }

  interface Button {
    label: string;
    color: string;
    textColor: string;
    action: () => void;
  }

  const props = defineProps<{
    title?: string;
    subtitle?: string;
    books: Book[];
    backgroundColor?: string;
    backgroundColorBooks?: string;
    buttons?: Button[];
  }>();

  const accentColor = computed(() => props.buttons?.[0]?.color ?? '#d98b9c');

  const currentBookIndex = computed(() => {
    const p = props.books[0]?.progressPercent ?? 0;
    const n = props.books.length;
    if (!p || !n) return -1;
    return Math.min(Math.ceil(p * n / 100) - 1, n - 1);
  });

  const fillPercent = computed(() => {
    const n = props.books.length;
    if (n < 2 || currentBookIndex.value < 0) return 0;
    return (currentBookIndex.value / (n - 1)) * 100;
  });
</script>

<style lang="scss" scoped>
.route-section {
  padding: 80px 0 40px;
  text-align: center;

  .route-title {
    font-weight: bold;
    font-size: 2rem;
    color: rgb(var(--v-theme-primary));
    margin-bottom: 20px;
  }

  .route-subtitle {
    margin-bottom: 20px;
    font-weight: 500;
  }

  .carousel-container {
    padding: 60px 80px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 1091px;
    margin: 0 auto;
  }

  .books {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0 65px;

    .book-cover {
      max-width: 120px;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      cursor: pointer;
    }
  }

  .progress-bar {
    position: relative;
    height: 2px;
    width: 76%;
    margin: 0 auto;
    background-color: white;
    border-radius: 2px;

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    .progress-dot {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid;
      box-sizing: border-box;

      &.dot-completed {
        width: 12px;
        height: 12px;
      }

      &.dot-active {
        width: 14px;
        height: 14px;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
      }

      &.dot-empty {
        background-color: white !important;
      }
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    max-width: 530px;
    margin: 50px auto 0;

    .action-btn {
      border-radius: 0;
      text-transform: none;
      font-weight: 500;
    }
  }
}
</style>
