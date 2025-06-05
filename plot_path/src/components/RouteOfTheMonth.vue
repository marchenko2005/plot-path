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
          <div
            v-for="(book, index) in books"
            :key="'dot-' + index"
            class="progress-dot"
            :style="{ left: `${(index / (books.length - 1)) * 100}%`, backgroundColor: buttons ? buttons[0].color : '#d98b9c' }"
          />
        </div>
        <span v-if="books[0]?.progressPercent">{{ books[0]?.progressPercent }}%</span>
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
  import { defineProps } from 'vue';
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

  defineProps<{
    title?: string;
    subtitle?: string;
    books: Book[];
    backgroundColor?: string;
    backgroundColorBooks?: string;
    buttons?: Button[];
  }>();
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

    .progress-dot {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background-color: #d98b9c;
      border-radius: 50%;
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
