<template>
  <div>
    <div class="section-title">Awards</div>
    <div class="awards-box">
      <div class="awards-grid">
        <v-tooltip
          v-for="award in awards"
          :key="award.Name"
          location="top"
          :open-delay="100"
        >
          <template #activator="{ props }">
            <div class="award-item" v-bind="props">
              <img :alt="award.Name" :src="award.ImageUrl">
            </div>
          </template>

          <div class="tooltip-content">
            <div class="tooltip-name">{{ award.Name }}</div>
            <div class="tooltip-desc">{{ award.Description }}</div>
          </div>
        </v-tooltip>
      </div>
      <router-link class="see-all" to="/awards">See all...</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
  export interface DisplayBadge {
    Name: string;
    ImageUrl: string;
    Description: string;
  }

  defineProps<{
    awards: DisplayBadge[];
  }>();
</script>

<style scoped lang="scss">
.section-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.awards-box {
  background: #d8dbea;
  border-radius: 14px;
  padding: 20px;

  .awards-grid {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 16px;
    justify-items: center;
    width: fit-content;

    .award-item {
      cursor: default;

      img {
        width: 72px;
        height: 72px;
        object-fit: contain;
        display: block;
      }
    }
  }

  .see-all {
    display: block;
    text-align: right;
    margin-top: 12px;
    font-size: 0.82rem;
    color: #444;
    text-decoration: underline;
  }
}

.tooltip-content {
  text-align: center;
  max-width: 200px;

  .tooltip-name {
    font-size: 0.85rem;
    font-weight: 400;
    color: #fff;
    opacity: 0.75;
    margin-bottom: 8px;
  }

  .tooltip-desc {
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.5;
  }
}
</style>
