import { useCallback, useEffect, useState } from 'react';

import {
  createCompany,
  deleteAllCompanies,
  deleteCompany,
  getCompanies,
  getCompanyFilters,
  updateCompany,
} from '../../api/companiesApi';

const LIMIT = 25;

export const STATUS_LABELS = {
  new: 'Новая',
  scanned: 'Проверена',
  no_form: 'Нет формы',
  error: 'Ошибка',
};

const EMPTY_FILTERS = {
  scanStatus: '',
  category: '',
  city: '',
  region: '',
};

const EMPTY_FILTER_OPTIONS = {
  statuses: [],
  categories: [],
  cities: [],
  regions: [],
  locations: [],
};

export function useCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingDatabase, setClearingDatabase] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [excludedIds, setExcludedIds] = useState(new Set());

  const loadFilterOptions = useCallback(async () => {
    setLoadingFilters(true);

    try {
      const data = await getCompanyFilters();

      setFilterOptions({
        statuses: data.statuses || [],
        categories: data.categories || [],
        cities: data.cities || [],
        regions: data.regions || [],
        locations: data.locations || [],
      });
    } catch (loadError) {
      setError(loadError.message || 'Не удалось загрузить фильтры');
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCompanies({
        search,
        scanStatus: filters.scanStatus,
        category: filters.category,
        city: filters.city,
        region: filters.region,
        page,
        limit: LIMIT,
      });

      if (data.pagination && page > data.pagination.lastPage) {
        setPage(data.pagination.lastPage);
        return;
      }

      setCompanies(data.companies || []);
      setPagination(data.pagination || null);
    } catch (loadError) {
      setError(loadError.message || 'Не удалось загрузить компании');
    } finally {
      setLoading(false);
    }
  }, [filters, page, search]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    const timeout = setTimeout(() => loadCompanies(), search ? 350 : 0);

    return () => clearTimeout(timeout);
  }, [filters, loadCompanies, page, search]);

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectAllFiltered(false);
    setExcludedIds(new Set());
  }

  const selectedCount = selectAllFiltered
    ? Math.max((pagination?.total || 0) - excludedIds.size, 0)
    : selectedIds.size;

  function isCompanySelected(companyId) {
    return selectAllFiltered ? !excludedIds.has(companyId) : selectedIds.has(companyId);
  }

  const currentPageAllSelected =
    companies.length > 0 && companies.every(company => isCompanySelected(company.id));

  function toggleCompany(companyId) {
    if (selectAllFiltered) {
      setExcludedIds(current => {
        const next = new Set(current);

        if (next.has(companyId)) {
          next.delete(companyId);
        } else {
          next.add(companyId);
        }

        return next;
      });

      return;
    }

    setSelectedIds(current => {
      const next = new Set(current);

      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }

      return next;
    });
  }

  function toggleCurrentPage() {
    const ids = companies.map(company => company.id);

    if (selectAllFiltered) {
      setExcludedIds(current => {
        const next = new Set(current);

        if (currentPageAllSelected) {
          ids.forEach(id => next.add(id));
        } else {
          ids.forEach(id => next.delete(id));
        }

        return next;
      });

      return;
    }

    setSelectedIds(current => {
      const next = new Set(current);

      if (currentPageAllSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }

      return next;
    });
  }

  function selectAllFound() {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setSelectAllFiltered(true);
  }

  const campaignSelection = selectAllFiltered
    ? {
        mode: 'filters',
        filters: {
          search,
          scanStatus: filters.scanStatus,
          category: filters.category,
          city: filters.city,
          region: filters.region,
        },
        excludedIds: [...excludedIds],
      }
    : {
        mode: 'ids',
        companyIds: [...selectedIds],
      };

  const suggestedCampaignName =
    [filters.category, filters.city || filters.region].filter(Boolean).join(' — ') ||
    'Новая кампания';

  function handleSearchChange(event) {
    clearSelection();
    setSearch(event.target.value);
    setPage(1);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    clearSelection();

    setFilters(current => {
      if (name === 'region') {
        if (!value) {
          return {
            ...current,
            region: '',
            city: '',
          };
        }

        const cityBelongsToRegion =
          !current.city ||
          filterOptions.locations.some(
            location => location.city === current.city && location.region === value,
          );

        return {
          ...current,
          region: value,
          city: cityBelongsToRegion ? current.city : '',
        };
      }

      if (name === 'city') {
        if (!value) {
          return {
            ...current,
            city: '',
          };
        }

        const matches = filterOptions.locations.filter(location => location.city === value);
        const currentRegionMatch = matches.find(location => location.region === current.region);
        const detectedRegion = currentRegionMatch?.region || matches[0]?.region || '';

        return {
          ...current,
          city: value,
          region: detectedRegion,
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });

    setPage(1);
  }

  function resetFilters() {
    clearSelection();
    setSearch('');
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  const hasActiveFilters = Boolean(
    search || filters.scanStatus || filters.category || filters.city || filters.region,
  );

  const availableCities = filters.region
    ? [
        ...new Set(
          (filterOptions.locations || [])
            .filter(location => location.region === filters.region)
            .map(location => location.city),
        ),
      ].sort((a, b) => a.localeCompare(b, 'ru'))
    : filterOptions.cities || [];

  async function saveCompany(company, form) {
    if (company) {
      await updateCompany(company.id, form);
    } else {
      await createCompany(form);
    }

    await Promise.all([loadCompanies(), loadFilterOptions()]);
  }

  async function handleDelete(company) {
    const confirmed = window.confirm(`Удалить компанию «${company.name}»?`);

    if (!confirmed) return;

    setDeletingId(company.id);
    setError(null);

    try {
      await deleteCompany(company.id);

      setSelectedIds(current => {
        const next = new Set(current);
        next.delete(company.id);
        return next;
      });

      setExcludedIds(current => {
        const next = new Set(current);
        next.delete(company.id);
        return next;
      });

      await Promise.all([loadCompanies(), loadFilterOptions()]);
    } catch (deleteError) {
      setError(deleteError.message || 'Не удалось удалить компанию');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearDatabase() {
    const confirmed = window.confirm(
      'Удалить ВСЕ компании из LeadBot?\n\nЭто действие нельзя отменить.',
    );

    if (!confirmed) return;

    const confirmation = window.prompt('Для подтверждения напишите УДАЛИТЬ');

    if (confirmation !== 'УДАЛИТЬ') return;

    setClearingDatabase(true);
    setError(null);

    try {
      const result = await deleteAllCompanies();

      clearSelection();
      resetFilters();

      await Promise.all([loadCompanies(), loadFilterOptions()]);

      window.alert(`База очищена.\nУдалено компаний: ${result.deleted}`);
    } catch (clearError) {
      setError(clearError.message || 'Не удалось очистить базу');
    } finally {
      setClearingDatabase(false);
    }
  }

  return {
    availableCities,
    campaignSelection,
    clearingDatabase,
    clearSelection,
    companies,
    currentPageAllSelected,
    deletingId,
    error,
    filterOptions,
    filters,
    handleClearDatabase,
    handleDelete,
    handleFilterChange,
    handleSearchChange,
    hasActiveFilters,
    isCompanySelected,
    loading,
    loadingFilters,
    page,
    pagination,
    resetFilters,
    saveCompany,
    search,
    selectAllFiltered,
    selectAllFound,
    selectedCount,
    setPage,
    suggestedCampaignName,
    toggleCompany,
    toggleCurrentPage,
  };
}
