import { useEffect, useMemo, useRef, useState } from 'react';

import {
  analyzeCompaniesImport,
  analyzeCompaniesImportSelection,
  commitCompaniesImport,
  discardCompaniesImport,
  getCompaniesImportRubrics,
  previewCompaniesImport,
} from '../../api/companiesImportApi';

const SAVED_CATEGORIES_KEY = 'leadbot:selectedCategories';
const SAVED_SUBCATEGORIES_KEY = 'leadbot:selectedSubcategories';

const getSavedValues = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const matchesSearch = (value, search) =>
  value.toLowerCase().includes(search.trim().toLowerCase());

export const formatImportNumber = (value) =>
  Number(value || 0).toLocaleString('ru-RU');

export function useCompaniesImport() {
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingRubrics, setLoadingRubrics] = useState(false);
  const [analyzingSelection, setAnalyzingSelection] = useState(false);
  const [importing, setImporting] = useState(false);

  const [preview, setPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [rubrics, setRubrics] = useState(null);
  const [selectionAnalysis, setSelectionAnalysis] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const [rubricSearch, setRubricSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(() =>
    getSavedValues(SAVED_CATEGORIES_KEY),
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState(() =>
    getSavedValues(SAVED_SUBCATEGORIES_KEY),
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(
      SAVED_CATEGORIES_KEY,
      JSON.stringify(selectedCategories),
    );
  }, [selectedCategories]);

  useEffect(() => {
    localStorage.setItem(
      SAVED_SUBCATEGORIES_KEY,
      JSON.stringify(selectedSubcategories),
    );
  }, [selectedSubcategories]);

  const visibleCategories = useMemo(
    () =>
      (rubrics?.categories || []).filter((item) =>
        matchesSearch(item.name, rubricSearch),
      ),
    [rubrics, rubricSearch],
  );

  const visibleSubcategories = useMemo(
    () =>
      (rubrics?.subcategories || []).filter((item) =>
        matchesSearch(item.name, rubricSearch),
      ),
    [rubrics, rubricSearch],
  );

  const selectedCount =
    selectedCategories.length + selectedSubcategories.length;

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const resetRubricView = () => {
    setRubrics(null);
    setRubricSearch('');
    setSelectionAnalysis(null);
  };

  const clearRubricSelection = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectionAnalysis(null);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoading(true);
    setPreview(null);
    setAnalysis(null);
    setImportResult(null);
    resetRubricView();
    setImportResult(null);
    setError(null);

    try {
      const data = await previewCompaniesImport(file);
      setPreview(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!preview?.importId) {
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const data = await analyzeCompaniesImport(preview.importId);
      setAnalysis(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadRubrics = async () => {
    if (!preview?.importId) {
      return;
    }

    setLoadingRubrics(true);
    setError(null);

    try {
      const data = await getCompaniesImportRubrics(preview.importId);
      setRubrics(data);

      const categoryNames = new Set(
        (data.categories || []).map((item) => item.name),
      );
      const subcategoryNames = new Set(
        (data.subcategories || []).map((item) => item.name),
      );

      setSelectedCategories((current) =>
        current.filter((item) => categoryNames.has(item)),
      );
      setSelectedSubcategories((current) =>
        current.filter((item) => subcategoryNames.has(item)),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoadingRubrics(false);
    }
  };

  const handleSelectionAnalyze = async () => {
    if (!preview?.importId || selectedCount === 0) {
      return;
    }

    setAnalyzingSelection(true);
    setError(null);

    try {
      const data = await analyzeCompaniesImportSelection({
        importId: preview.importId,
        categories: selectedCategories,
        subcategories: selectedSubcategories,
      });

      setSelectionAnalysis(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAnalyzingSelection(false);
    }
  };

  const handleImport = async () => {
    if (
      !preview?.importId ||
      !selectionAnalysis ||
      selectionAnalysis.readyToImport <= 0
    ) {
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const data = await commitCompaniesImport({
        importId: preview.importId,
        categories: selectedCategories,
        subcategories: selectedSubcategories,
      });

      setImportResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setImporting(false);
    }
  };

  const finishImport = () => {
    window.location.reload();
  };

  const toggleValue = (value, setter) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );

    setSelectionAnalysis(null);
  };

  const toggleCategory = (value) => {
    toggleValue(value, setSelectedCategories);
  };

  const toggleSubcategory = (value) => {
    toggleValue(value, setSelectedSubcategories);
  };

  const backToRubrics = () => {
    setSelectionAnalysis(null);
  };

  const closePreview = () => {
    if (analyzing || loadingRubrics || analyzingSelection || importing) {
      return;
    }

    if (preview?.importId && !importResult) {
      discardCompaniesImport(preview.importId).catch(() => {});
    }

    setPreview(null);
    setAnalysis(null);
    resetRubricView();
    setError(null);
  };

  return {
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
  };
}
