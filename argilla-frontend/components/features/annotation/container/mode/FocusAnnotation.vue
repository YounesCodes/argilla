<template>
  <TranslationReview
    v-if="canReviewTranslations && !standardView"
    :record="record"
    :recordCriteria="recordCriteria"
    :is-draft-saving="isDraftSaving"
    :is-submitting="isSubmitting"
    :is-discarding="isDiscarding"
    @submit="onSubmit"
    @discard="onDiscard"
    @save-draft="onSaveDraft"
    @show-standard="standardView = true"
  />
  <VerticalResizable
    v-else
    class="wrapper review-view"
    :style="{ '--review-text-size': `${reviewTextSize}px` }"
    :id="`${recordCriteria.datasetId}-r-v-rz`"
  >
    <template #left>
      <HorizontalResizable
        :id="`${recordCriteria.datasetId}-r-h-rz`"
        class="wrapper__left"
        collapsable
      >
        <template #up>
          <section class="wrapper__records" aria-label="Focus Annotation View">
            <DatasetFilters :recordCriteria="recordCriteria">
              <ToggleAnnotationType
                v-if="
                  records.hasRecordsToAnnotate &&
                  recordCriteria.committed.isPending
                "
                :recordCriteria="recordCriteria"
            /></DatasetFilters>
            <SimilarityRecordReference
              v-show="recordCriteria.isFilteringBySimilarity"
              v-if="!!records.reference"
              :fields="records.reference.fields"
              :recordCriteria="recordCriteria"
              :availableVectors="datasetVectors"
            />
            <div class="wrapper__records__header">
              <ReviewTextSize v-model="reviewTextSize" />
              <BaseButton
                v-if="canReviewTranslations"
                @on-click="standardView = false"
              >
                {{ $t("translationReview.compact") }}
              </BaseButton>
              <PaginationFeedbackTask :recordCriteria="recordCriteria" />
            </div>
            <div v-if="recordsMessage" class="wrapper--empty">
              <p class="wrapper__text --heading3" v-html="recordsMessage" />
            </div>
            <Record
              v-else
              :datasetVectors="datasetVectors"
              :recordCriteria="recordCriteria"
              :record="record"
            />
          </section>
        </template>
        <template #downHeader>
          <p v-text="$t('guidelines')" />
        </template>
        <template #downHeaderExpanded>
          <p v-text="$t('guidelines')" />
        </template>
        <template #downContent>
          <AnnotationGuidelines />
        </template>
      </HorizontalResizable>
    </template>

    <template #right>
      <HorizontalResizable
        :id="`${recordCriteria.datasetId}-q-h-rz}`"
        class="wrapper__right"
        collapsable
      >
        <template #up>
          <QuestionsForm
            v-if="!!record"
            :key="`${record.id}_questions`"
            class="wrapper__form"
            :class="statusClass"
            :datasetId="recordCriteria.datasetId"
            :record="record"
            :show-discard-button="!record.isDiscarded"
            :is-draft-saving="isDraftSaving"
            :is-submitting="isSubmitting"
            :is-discarding="isDiscarding"
            :enableAutoSubmitWithKeyboard="true"
            @on-submit-responses="onSubmit"
            @on-discard-responses="onDiscard"
            @on-save-draft="onSaveDraft"
          />
        </template>
        <template #downHeader>
          <AnnotationProgress
            class="annotation-progress"
            :datasetId="recordCriteria.datasetId"
          />
        </template>
        <template #downHeaderExpanded>
          <p v-text="$t('metrics.progress.my')" />
        </template>
        <template #downContent>
          <AnnotationProgressDetailed :datasetId="recordCriteria.datasetId" />
        </template>
      </HorizontalResizable>
    </template>
    <BaseCollapsablePanel
      hideOnDesktop
      :isExpanded="expandedGuidelines"
      @toggle-expand="expandedGuidelines = !expandedGuidelines"
    >
      <template #panelHeader>
        <p v-text="$t('guidelines')" />
      </template>
      <template #panelContent>
        <AnnotationGuidelines />
      </template>
    </BaseCollapsablePanel>
  </VerticalResizable>
</template>

<script>
import { useFocusAnnotationViewModel } from "./useFocusAnnotationViewModel";
export default {
  props: {
    recordCriteria: {
      type: Object,
      required: true,
    },
    datasetVectors: {
      type: Array,
      required: false,
    },
    records: {
      type: Object,
      required: true,
    },
    record: {
      type: Object,
    },
    recordsMessage: {
      type: String,
    },
    statusClass: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      expandedGuidelines: false,
      reviewTextSize: 16,
      standardView: false,
    };
  },
  computed: {
    canReviewTranslations() {
      return [
        "final_french",
        "final_darija_arabic",
        "final_darija_latin",
        "final_english",
      ].every((name) =>
        this.record?.questions.some(
          (question) => question.name === name && question.isTextType
        )
      );
    },
  },
  methods: {
    async onSubmit() {
      await this.submit(this.record);
      this.$emit("on-submit-responses");
    },
    async onDiscard() {
      if (this.record.isDiscarded) return;

      await this.discard(this.record);
      this.$emit("on-discard-responses");
    },
    async onSaveDraft() {
      await this.saveAsDraft(this.record);
    },
  },
  setup() {
    return useFocusAnnotationViewModel();
  },
};
</script>

<style lang="scss" scoped>
.wrapper {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  height: 100%;
  &__inner {
    display: flex;
  }
  @include media("<desktop") {
    flex-flow: column;
    overflow: auto;
  }
  &__left,
  &__right {
    @include media("<desktop") {
      overflow: visible;
      height: 100% !important;
      max-height: none !important;
    }
  }
  &__left {
    @include media("<desktop") {
      :deep(.resizable-h__down) {
        display: none;
      }
    }
  }
  &__form {
    padding: $base-space * 2;
  }
  &__records {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $base-space;
    height: 100%;
    min-width: 0;
    padding: $base-space * 2;
    &__header {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: $base-space;
    }
  }
  &__text {
    color: var(--fg-secondary);
    max-width: 80%;
  }
  &--empty {
    width: 100%;
    text-align: center;
    height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    @include media("<=tablet") {
      height: 100%;
      text-align: center;
    }
  }
}
.annotation-progress {
  .--expanded & {
    display: none;
  }
}
.annotation-progress__title {
  display: none;
  .--expanded & {
    display: block;
  }
}
</style>

<style lang="scss" scoped>
// Only reading/editing content scales. Labels, navigation and actions keep their size.
.review-view {
  :deep(.text_field_component .content-area),
  :deep(.text_field_component .markdown-render),
  :deep(.textarea .content__text),
  :deep(.textarea--markdown) {
    font-size: var(--review-text-size);
    line-height: 1.5;
  }

  .wrapper__records__header {
    justify-content: space-between;
    flex-wrap: wrap;
  }

  @include media("<desktop") {
    // Saved desktop pane sizes must not constrain the phone layout.
    :deep(.resizable-v__left),
    :deep(.resizable-v__right) {
      flex: none;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      margin: 0;
      align-items: stretch;
    }

    .wrapper__left,
    .wrapper__right {
      height: auto !important;
      min-width: 0;
      flex: none;
    }

    :deep(.resizable-h__up) {
      flex: none;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible;
    }

    .wrapper__records {
      height: auto;
      padding: $base-space;
    }

    .wrapper__form {
      padding: $base-space;
    }

    :deep(.record),
    :deep(.record__wrapper) {
      flex: none;
    }

    :deep(.record__content) {
      overflow: visible;
      padding: $base-space;
    }

    :deep(.record__fixed-header) {
      padding: $base-space;
    }

    :deep(.text_field_component) {
      padding: $base-space;
    }

    :deep(.questions-form__content) {
      overflow: visible;
    }

    :deep(.footer-form) {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }

    :deep(.button__shortcuts) {
      display: none;
    }

    :deep(.text_field_component__copy-button) {
      opacity: 1;
      min-width: 44px;
      min-height: 44px;
    }

    :deep(.textarea .content__text) {
      font-size: max(16px, var(--review-text-size));
    }
  }
}
</style>
