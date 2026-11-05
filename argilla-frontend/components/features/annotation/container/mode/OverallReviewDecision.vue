<template>
  <fieldset class="overall-decision" :disabled="disabled">
    <legend>{{ $t("translationReview.overall") }}</legend>
    <div class="overall-decision__options">
      <label
        v-for="decision in decisions"
        :key="decision"
        :class="{ selected: selected === decision }"
      >
        <input
          type="radio"
          name="overall-review-decision"
          :value="decision"
          :checked="selected === decision"
          @change="choose(decision)"
        />
        {{ $t(`translationReview.${decision}`) }}
      </label>
    </div>
    <p v-if="!selected">{{ $t("translationReview.chooseOverall") }}</p>
  </fieldset>
</template>

<script>
import {
  DECISIONS,
  overallDecision,
  setOverallDecision,
} from "./overallReviewDecision";
export default {
  props: {
    questions: { type: Array, required: true },
    disabled: { type: Boolean, default: false },
  },
  data: () => ({ decisions: DECISIONS }),
  computed: {
    selected() {
      return overallDecision(this.questions);
    },
  },
  methods: {
    choose(value) {
      setOverallDecision(this.questions, value);
    },
  },
};
</script>

<style lang="scss" scoped>
.overall-decision {
  border: 0;
  margin: 0 0 $base-space;
  padding: 0;
  background: var(--bg-form);
  border-radius: $border-radius-m;
  legend {
    font-size: 14px;
    padding-top: $base-space;
    @include media("<=tablet") {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }
  &__options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $base-space;
  }
  label {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 $base-space;
    border: 1px solid var(--bg-opacity-20);
    border-radius: $border-radius-m;
    cursor: pointer;
    justify-content: center;
  }
  label.selected {
    border-color: var(--fg-cuaternary);
    background: var(--bg-accent-grey-2);
  }
  p {
    font-size: 12px;
    color: var(--fg-secondary);
  }
}
</style>
