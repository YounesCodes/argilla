<template>
  <section
    class="translation-review review-view"
    :style="textStyle"
    aria-label="Translation review"
  >
    <div class="translation-review__toolbar">
      <ReviewTextSize v-model="textSize" />
      <PaginationFeedbackTask :recordCriteria="recordCriteria" />
      <button
        class="standard-view-button"
        type="button"
        :aria-label="$t('translationReview.standard')"
        :title="$t('translationReview.standard')"
        @click="$emit('show-standard')"
      >
        <span class="standard-label">{{
          $t("translationReview.standard")
        }}</span>
        <span class="standard-icon" aria-hidden="true">⋯</span>
      </button>
      <details class="review-tools" ref="tools">
        <summary :aria-label="$t('translationReview.tools')">⋯</summary>
        <div class="review-tools__menu">
          <p>{{ dataset && dataset.name }}</p>
          <button
            type="button"
            :aria-expanded="navigationOpen"
            @click="toggleNavigation"
          >
            {{ $t("translationReview.navigation") }}
          </button>
          <button type="button" @click="$emit('show-standard')">
            {{ $t("translationReview.standard") }}
          </button>
        </div>
      </details>
    </div>
    <QuestionsForm
      ref="form"
      :key="record.id"
      class="translation-review__judgments"
      :record="record"
      :datasetId="recordCriteria.datasetId"
      :hidden-question-names="hiddenQuestionNames"
      :is-submit-disabled="useOverallDecision && !overallValue"
      :show-discard-button="!record.isDiscarded"
      :is-draft-saving="isDraftSaving"
      :is-submitting="isSubmitting"
      :is-discarding="isDiscarding"
      @on-submit-responses="$emit('submit')"
      @on-discard-responses="$emit('discard')"
      @on-save-draft="$emit('save-draft')"
    >
      <template #before-questions>
        <div class="translation-review__cards">
          <section
            v-for="card in cards"
            :key="card.question.id"
            class="translation-review__card"
            :aria-label="card.label"
          >
            <h2>{{ card.label }}</h2>
            <TextAreaContents :question="card.question" :is-focused="false" />
          </section>
        </div>
      </template>
      <template #before-actions>
        <OverallReviewDecision
          v-if="useOverallDecision"
          :questions="decisionQuestions"
          :disabled="isSubmitting || isDraftSaving || isDiscarding"
        />
      </template>
      <template #after-questions>
        <details
          v-if="optionalNotes.length"
          class="translation-review__details"
        >
          <summary>{{ $t("translationReview.notes") }}</summary>
          <section v-for="question in optionalNotes" :key="question.id">
            <h2>{{ question.title }}</h2>
            <TextAreaContents :question="question" :is-focused="false" />
          </section>
        </details>
        <details class="translation-review__details">
          <summary>{{ $t("translationReview.originals") }}</summary>
          <RecordFields
            :record="record"
            :fields="record.fields"
            :recordCriteria="recordCriteria"
          />
        </details>
        <details class="translation-review__details">
          <summary>{{ $t("translationReview.filters") }}</summary>
          <DatasetFilters :recordCriteria="recordCriteria" />
          <AnnotationGuidelines />
        </details>
      </template>
    </QuestionsForm>
  </section>
</template>

<script>
import { useDataset } from "~/v1/infrastructure/storage/DatasetStorage";
import {
  CRITERIA,
  REVIEW_DATASET,
  overallDecision,
} from "./overallReviewDecision";
export default {
  inject: { setReviewNavigation: { default: () => () => {} } },
  setup() {
    const { state: dataset } = useDataset();
    return { dataset };
  },
  props: {
    record: { type: Object, required: true },
    recordCriteria: { type: Object, required: true },
    isDraftSaving: { type: Boolean, required: true },
    isSubmitting: { type: Boolean, required: true },
    isDiscarding: { type: Boolean, required: true },
  },
  data: () => ({ textSize: 20, navigationOpen: false }),
  methods: {
    toggleNavigation() {
      this.navigationOpen = !this.navigationOpen;
      this.setReviewNavigation(this.navigationOpen);
      this.$refs.tools.open = false;
    },
  },
  beforeDestroy() {
    this.setReviewNavigation(false);
  },
  watch: {
    "record.id"() {
      // Question focus can scroll the container while the next record mounts.
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          const content = this.$refs.form?.$el.querySelector(
            ".questions-form__content"
          );
          if (content) content.scrollTop = 0;
        });
      });
    },
  },
  computed: {
    decisionQuestions() {
      return this.record.questions.filter((question) =>
        CRITERIA.includes(question.name)
      );
    },
    useOverallDecision() {
      return (
        this.dataset?.name === REVIEW_DATASET &&
        this.decisionQuestions.length === 3 &&
        this.decisionQuestions.every((question) => question.isSingleLabelType)
      );
    },
    overallValue() {
      return overallDecision(this.decisionQuestions);
    },
    optionalNotes() {
      return this.record.questions.filter(
        (question) => question.isTextType && !question.isRequired
      );
    },
    hiddenQuestionNames() {
      return [
        ...(this.useOverallDecision ? CRITERIA : []),
        ...this.cards.map((card) => card.question.name),
        ...this.optionalNotes.map((question) => question.name),
      ];
    },
    textStyle() {
      return { "--review-text-size": `${this.textSize}px` };
    },
    cards() {
      return [
        ["final_french", "French"],
        ["final_darija_arabic", "Darija · العربية"],
        ["final_darija_latin", "Darija · Latin"],
        ["final_english", "English"],
      ].map(([name, label]) => ({
        label,
        question: this.record.questions.find(
          (question) => question.name === name
        ),
      }));
    },
  },
};
</script>

<style lang="scss" scoped>
.translation-review {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--fg-primary);
  &__toolbar {
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $base-space;
    padding: $base-space;
    border-bottom: 1px solid var(--bg-opacity-10);
    @include media("<=tablet") {
      padding-block: 4px;
      :deep(.review-text-size label) {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }
    }
    button {
      margin-left: auto;
      min-height: 44px;
      color: var(--fg-secondary);
      background: var(--bg-accent-grey-1);
      border: 1px solid var(--bg-opacity-20);
      border-radius: $border-radius;
      cursor: pointer;
      min-width: 44px;
      .standard-icon {
        display: none;
      }
      @include media("<=tablet") {
        .standard-label {
          display: none;
        }
        .standard-icon {
          display: inline;
          font-size: 24px;
        }
      }
    }
    .standard-view-button {
      @include media("<=tablet") {
        display: none;
      }
    }
    .review-tools {
      display: none;
      margin-left: auto;
      @include media("<=tablet") {
        display: block;
      }
      summary {
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: 44px;
        font-size: 24px;
        cursor: pointer;
        &::-webkit-details-marker {
          display: none;
        }
      }
      &__menu {
        position: absolute;
        top: 100%;
        right: $base-space;
        z-index: 5;
        width: min(320px, 90vw);
        padding: $base-space * 2;
        border: 1px solid var(--bg-opacity-20);
        border-radius: $border-radius-m;
        background: var(--bg-accent-grey-1);
        p {
          overflow-wrap: anywhere;
          margin: 0 0 $base-space;
          font-size: 13px;
        }
        button {
          display: block;
          width: 100%;
          margin: $base-space 0 0;
        }
      }
    }
  }
  &__cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $base-space;
    @include media("<=tablet") {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  &__card {
    min-width: 0;
    h2 {
      font-size: 12px;
      color: var(--fg-secondary);
      margin: 0 0 4px;
    }
    :deep(.container) {
      min-height: 0;
      padding: 0;
    }
    :deep(.content__text),
    :deep(.markdown-render) {
      font-size: var(--review-text-size);
      line-height: 1.4;
      font-style: normal;
      padding: 6px 8px;
    }
  }
  &__judgments {
    flex: 1;
    flex-basis: 0;
    min-height: 0;
    min-width: 0;
    margin: 0;
    :deep(.questions-form__content) {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: $base-space;
      scroll-padding-block: $base-space * 2;
    }
    :deep(.questions) {
      gap: $base-space;
      > div > .wrapper {
        gap: 4px;
      }
      .title-area {
        font-size: 12px;
      }
    }
    :deep(.button__shortcuts) {
      display: none;
    }
    :deep(.footer-form) {
      flex-shrink: 0;
      padding: $base-space;
      padding-bottom: max(#{$base-space}, env(safe-area-inset-bottom));
      background: var(--bg-accent-grey-1);
      border-top: 1px solid var(--bg-opacity-10);
    }
  }
  &__details {
    margin-top: $base-space;
    summary {
      padding: $base-space;
      min-height: 44px;
      cursor: pointer;
      color: var(--fg-secondary);
    }
  }
}
</style>
