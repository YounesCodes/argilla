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
    </div>
    <div ref="body" class="translation-review__body">
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
      <QuestionsForm
        :key="record.id"
        class="translation-review__judgments"
        :record="record"
        :datasetId="recordCriteria.datasetId"
        :hidden-question-names="hiddenQuestionNames"
        :show-discard-button="!record.isDiscarded"
        :is-draft-saving="isDraftSaving"
        :is-submitting="isSubmitting"
        :is-discarding="isDiscarding"
        @on-submit-responses="$emit('submit')"
        @on-discard-responses="$emit('discard')"
        @on-save-draft="$emit('save-draft')"
      />
      <details v-if="optionalNotes.length" class="translation-review__details">
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
    </div>
  </section>
</template>

<script>
export default {
  props: {
    record: { type: Object, required: true },
    recordCriteria: { type: Object, required: true },
    isDraftSaving: { type: Boolean, required: true },
    isSubmitting: { type: Boolean, required: true },
    isDiscarding: { type: Boolean, required: true },
  },
  data: () => ({ textSize: 20 }),
  watch: {
    "record.id"() {
      // Question focus can scroll the container while the next record mounts.
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          if (this.$refs.body) this.$refs.body.scrollTop = 0;
        });
      });
    },
  },
  computed: {
    optionalNotes() {
      return this.record.questions.filter(
        (question) => question.isTextType && !question.isRequired
      );
    },
    hiddenQuestionNames() {
      return [
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
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $base-space;
    padding: $base-space;
    border-bottom: 1px solid var(--bg-opacity-10);
    @include media("<=tablet") {
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
  }
  &__body {
    overflow: auto;
    padding: $base-space;
    padding-bottom: max(#{$base-space}, env(safe-area-inset-bottom));
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
    height: auto;
    min-width: 0;
    margin-top: $base-space;
    :deep(.questions-form__content) {
      overflow: visible;
      padding: $base-space;
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
      position: sticky;
      bottom: 0;
      z-index: 2;
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
