<template>
  <v-container class="library-gallery">
    <v-row>
      <div class="flex-wrapper">
        <div class="left-column">
          <img
            class="gallery-img"
            :src="images[0]"
          >
          <img
            class="gallery-img"
            :src="images[1]"
          >
        </div>
        <div class="right-column">
          <img
            class="gallery-img full-height"
            :src="images[2]"
          >
        </div>
      </div>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  const images = [
    '/images/book_shelf.webp',
    '/images/library.webp',
    '/images/girl.webp',
  ];
</script>

<style lang="scss" scoped>
.library-gallery {
  background-color: #fff;
  padding-top: 100px;
  padding-bottom: 100px;

  .flex-wrapper {
    display: flex;
    justify-content: space-between;
    gap: 3rem;
    align-items: stretch;
    width: 100%;

    .left-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex: 1;
    }

    .right-column {
      flex: 1;
      display: flex;

      .full-height {
        height: 100%;
      }
    }

    .gallery-img {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .right-column .gallery-img {
      aspect-ratio: auto;
    }
  }
}
</style>
