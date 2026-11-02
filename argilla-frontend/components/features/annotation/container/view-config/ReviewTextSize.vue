<template>
  <div
    class="review-text-size"
    role="group"
    :aria-label="$t('reviewTextSize.label')"
  >
    <label for="review-text-size">{{ $t("reviewTextSize.label") }}</label>
    <select id="review-text-size" v-model.number="size">
      <option v-for="option in sizes" :key="option" :value="option">
        {{ option }} px
      </option>
    </select>
  </div>
</template>

<script>
const STORAGE_KEY = "argilla.review-text-size";
const SIZES = [16, 18, 20, 22, 24, 28, 32];

export default {
  props: {
    value: { type: Number, default: 16 },
  },
  data: () => ({ sizes: SIZES }),
  computed: {
    size: {
      get() {
        return this.value;
      },
      set(value) {
        if (!SIZES.includes(value)) return;
        this.$emit("input", value);
        try {
          localStorage.setItem(STORAGE_KEY, String(value));
        } catch {
          // The control remains usable when browser storage is unavailable.
        }
      },
    },
  },
  mounted() {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY));
      if (SIZES.includes(saved)) this.$emit("input", saved);
    } catch {
      // Use the default in browsers that block local storage.
    }
  },
};
</script>

<style lang="scss" scoped>
.review-text-size {
  display: flex;
  align-items: center;
  gap: $base-space;
  color: var(--fg-secondary);
  font-size: 13px;

  select {
    min-height: 44px;
    padding: 0 $base-space;
    border: 1px solid var(--bg-opacity-20);
    border-radius: $border-radius;
    background: var(--bg-accent-grey-1);
    color: var(--fg-primary);
    font-size: 16px;
    cursor: pointer;
  }
}
</style>
