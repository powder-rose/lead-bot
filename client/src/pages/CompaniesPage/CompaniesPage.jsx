import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Content } from '../../App.styles';
import { CompaniesImport } from '../../components/CompaniesImport/CompaniesImport';
import { CreateCampaign } from '../../components/CreateCampaign/CreateCampaign';
import { Header } from '../../components/Header/Header';

import { CompaniesTable } from './CompaniesTable';
import { CompanyEditorModal } from './CompanyEditorModal';
import {
  AddButton,
  BulkActionButton,
  ClearDatabaseButton,
  CompaniesSummary,
  CompaniesToolbar,
  CreateCampaignButton,
  ErrorMessage,
  FilterBar,
  FilterSelect,
  ResetFiltersButton,
  SearchInput,
  SelectAllButton,
  SelectionActions,
  SelectionBar,
  SelectionInfo,
  ToolbarActions,
} from './CompaniesPage.styles';
import { STATUS_LABELS, useCompaniesPage } from './useCompaniesPage';

export function CompaniesPage() {
  const navigate = useNavigate();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);

  const {
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
  } = useCompaniesPage();

  function openCreateModal() {
    setEditingCompany(null);
    setEditorOpen(true);
  }

  function openEditModal(company) {
    setEditingCompany(company);
    setEditorOpen(true);
  }

  function closeEditorModal() {
    setEditorOpen(false);
    setEditingCompany(null);
  }

  function handleCampaignCreated() {
    setCampaignModalOpen(false);
    clearSelection();
    navigate('/campaigns');
  }

  return (
    <>
      <Header
        eyebrow="LeadBot"
        title="База компаний"
        subtitle="Компании, сайты, категории и статусы обработки"
      />

      <Content>
        <CompaniesToolbar>
          <div>
            <strong>Компании</strong>
            <CompaniesSummary>
              {pagination ? `Найдено: ${pagination.total.toLocaleString('ru-RU')}` : 'Загрузка...'}
            </CompaniesSummary>
          </div>

          <ToolbarActions>
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Поиск по компании, сайту, городу..."
            />

            <ClearDatabaseButton
              type="button"
              onClick={handleClearDatabase}
              disabled={clearingDatabase}
            >
              {clearingDatabase ? 'Удаляем...' : 'Очистить базу'}
            </ClearDatabaseButton>

            <CompaniesImport />

            <AddButton type="button" onClick={openCreateModal}>
              <span>+</span>
              Добавить компанию
            </AddButton>
          </ToolbarActions>
        </CompaniesToolbar>

        <FilterBar>
          <FilterSelect
            name="scanStatus"
            value={filters.scanStatus}
            onChange={handleFilterChange}
            disabled={loadingFilters}
          >
            <option value="">Все статусы</option>
            {(filterOptions.statuses || []).map(status => (
              <option key={status} value={status}>
                {STATUS_LABELS[status] || status}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            disabled={loadingFilters}
          >
            <option value="">Все рубрики</option>
            {(filterOptions.categories || []).map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            disabled={loadingFilters}
          >
            <option value="">Все города</option>
            {(availableCities || []).map(city => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            name="region"
            value={filters.region}
            onChange={handleFilterChange}
            disabled={loadingFilters}
          >
            <option value="">Все регионы</option>
            {(filterOptions.regions || []).map(region => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </FilterSelect>

          {hasActiveFilters && (
            <ResetFiltersButton type="button" onClick={resetFilters}>
              Сбросить
            </ResetFiltersButton>
          )}
        </FilterBar>

        {selectedCount > 0 && (
          <SelectionBar>
            <SelectionInfo>
              {selectAllFiltered ? 'Выбраны все найденные' : 'Выбрано'}:{' '}
              {selectedCount.toLocaleString('ru-RU')} компаний
            </SelectionInfo>

            <SelectionActions>
              {!selectAllFiltered && pagination && pagination.total > selectedCount && (
                <SelectAllButton type="button" onClick={selectAllFound}>
                  Выбрать все найденные ({pagination.total.toLocaleString('ru-RU')})
                </SelectAllButton>
              )}

              <BulkActionButton type="button" onClick={clearSelection}>
                Снять выбор
              </BulkActionButton>

              <CreateCampaignButton type="button" onClick={() => setCampaignModalOpen(true)}>
                Создать кампанию
              </CreateCampaignButton>
            </SelectionActions>
          </SelectionBar>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <CompaniesTable
          companies={companies}
          currentPageAllSelected={currentPageAllSelected}
          deletingId={deletingId}
          isCompanySelected={isCompanySelected}
          loading={loading}
          onDelete={handleDelete}
          onEdit={openEditModal}
          onPageChange={setPage}
          onToggleCompany={toggleCompany}
          onToggleCurrentPage={toggleCurrentPage}
          pagination={pagination}
        />
      </Content>

      <CompanyEditorModal
        company={editingCompany}
        open={editorOpen}
        onClose={closeEditorModal}
        onSave={saveCompany}
      />

      <CreateCampaign
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        selectedCount={selectedCount}
        selection={campaignSelection}
        suggestedName={suggestedCampaignName}
        onCreated={handleCampaignCreated}
      />
    </>
  );
}
