import {
  CancelButton,
  CloseButton,
  ContinueButton,
  FileInfo,
  HiddenFileInput,
  ImportButton,
  ImportError,
  ImportHeader,
  ImportModal,
  ImportOverlay,
  ImportSubtitle,
  ImportTitle,
  ModalActions,
} from './CompaniesImport.styles';
import { CompaniesImportRubrics } from './CompaniesImportRubrics';
import {
  ImportAnalysisStep,
  ImportPreviewStep,
  ImportResultStep,
  SelectionAnalysisStep,
} from './CompaniesImportSteps';
import { formatImportNumber, useCompaniesImport } from './useCompaniesImport';

const getModalTitle = ({ importResult, selectionAnalysis, rubrics, analysis }) => {
  if (importResult) return 'Импорт завершён';
  if (selectionAnalysis) return 'Выборка готова';
  if (rubrics) return 'Выбор рубрик';
  if (analysis) return 'Анализ базы';
  return 'Предпросмотр импорта';
};

const getModalSubtitle = ({
  importResult,
  selectionAnalysis,
  rubrics,
  analysis,
}) => {
  if (importResult) {
    return 'Компании записаны в базу LeadBot и готовы к дальнейшей обработке';
  }

  if (selectionAnalysis) {
    return 'Точный расчёт компаний по выбранным рубрикам перед импортом';
  }

  if (rubrics) {
    return 'Выберите рубрики 2ГИС, компании из которых будут использоваться в LeadBot';
  }

  if (analysis) {
    return 'Полный анализ файла перед выбором нужных компаний';
  }

  return 'Проверьте структуру базы перед полным анализом';
};

export function CompaniesImport() {
  const importFlow = useCompaniesImport();

  const {
    inputRef,
    loading,
    analyzing,
    loadingRubrics,
    analyzingSelection,
    importing,
    preview,
    analysis,
    rubrics,
    selectionAnalysis,
    importResult,
    rubricSearch,
    selectedCategories,
    selectedSubcategories,
    visibleCategories,
    visibleSubcategories,
    selectedCount,
    error,
    setRubricSearch,
    openFilePicker,
    handleFileChange,
    handleAnalyze,
    handleLoadRubrics,
    handleSelectionAnalyze,
    handleImport,
    finishImport,
    resetRubricView,
    clearRubricSelection,
    toggleCategory,
    toggleSubcategory,
    backToRubrics,
    closePreview,
  } = importFlow;

  const modalBusy =
    analyzing || loadingRubrics || analyzingSelection || importing;

  return (
    <>
      <ImportButton type="button" onClick={openFilePicker} disabled={loading}>
        {loading ? 'Читаем файл...' : 'Импортировать базу'}
      </ImportButton>

      <HiddenFileInput
        ref={inputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
      />

      {error && !preview && <ImportError>{error}</ImportError>}

      {preview && (
        <ImportOverlay
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePreview();
            }
          }}
        >
          <ImportModal>
            <ImportHeader>
              <div>
                <ImportTitle>{getModalTitle(importFlow)}</ImportTitle>
                <ImportSubtitle>{getModalSubtitle(importFlow)}</ImportSubtitle>
              </div>

              <CloseButton
                type="button"
                onClick={closePreview}
                disabled={modalBusy}
              >
                ×
              </CloseButton>
            </ImportHeader>

            <FileInfo>
              <strong>{preview.originalName}</strong>
              <span>{(preview.fileSize / 1024 / 1024).toFixed(1)} МБ</span>
            </FileInfo>

            {!analysis ? (
              <ImportPreviewStep preview={preview} />
            ) : importResult ? (
              <ImportResultStep importResult={importResult} />
            ) : selectionAnalysis ? (
              <SelectionAnalysisStep
                selectionAnalysis={selectionAnalysis}
                selectedCount={selectedCount}
              />
            ) : rubrics ? (
              <CompaniesImportRubrics
                rubrics={rubrics}
                rubricSearch={rubricSearch}
                selectedCategories={selectedCategories}
                selectedSubcategories={selectedSubcategories}
                visibleCategories={visibleCategories}
                visibleSubcategories={visibleSubcategories}
                selectedCount={selectedCount}
                onSearchChange={setRubricSearch}
                onToggleCategory={toggleCategory}
                onToggleSubcategory={toggleSubcategory}
              />
            ) : (
              <ImportAnalysisStep analysis={analysis} />
            )}

            {error && <ImportError>{error}</ImportError>}

            <ModalActions>
              {importResult ? (
                <ContinueButton type="button" onClick={finishImport}>
                  Готово
                </ContinueButton>
              ) : selectionAnalysis ? (
                <>
                  <CancelButton type="button" onClick={backToRubrics}>
                    Назад к рубрикам
                  </CancelButton>

                  <ContinueButton
                    type="button"
                    onClick={handleImport}
                    disabled={
                      importing || selectionAnalysis.readyToImport <= 0
                    }
                  >
                    {importing
                      ? 'Импортируем компании...'
                      : `Импортировать ${formatImportNumber(
                          selectionAnalysis.readyToImport,
                        )}`}
                  </ContinueButton>
                </>
              ) : rubrics ? (
                <>
                  <CancelButton
                    type="button"
                    onClick={clearRubricSelection}
                    disabled={selectedCount === 0}
                  >
                    Очистить выбор
                  </CancelButton>

                  <CancelButton type="button" onClick={resetRubricView}>
                    Назад
                  </CancelButton>

                  <ContinueButton
                    type="button"
                    onClick={handleSelectionAnalyze}
                    disabled={selectedCount === 0 || analyzingSelection}
                  >
                    {analyzingSelection
                      ? 'Считаем выбранные компании...'
                      : `Рассчитать выборку (${selectedCount})`}
                  </ContinueButton>
                </>
              ) : (
                <>
                  <CancelButton
                    type="button"
                    onClick={closePreview}
                    disabled={analyzing || loadingRubrics}
                  >
                    Закрыть
                  </CancelButton>

                  {!analysis ? (
                    <ContinueButton
                      type="button"
                      onClick={handleAnalyze}
                      disabled={analyzing}
                    >
                      {analyzing
                        ? 'Анализируем весь файл...'
                        : 'Анализировать весь файл'}
                    </ContinueButton>
                  ) : (
                    <ContinueButton
                      type="button"
                      onClick={handleLoadRubrics}
                      disabled={loadingRubrics}
                    >
                      {loadingRubrics ? 'Читаем рубрики...' : 'Выбрать рубрики'}
                    </ContinueButton>
                  )}
                </>
              )}
            </ModalActions>
          </ImportModal>
        </ImportOverlay>
      )}
    </>
  );
}
