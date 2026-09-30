import {
    useCallback,
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
    Content,
} from "../../App.styles.js";

import {
    Header,
} from "../../components/Header/Header.jsx";

import {
    CompaniesImport,
} from "../../components/CompaniesImport/CompaniesImport.jsx";

import { CreateCampaign } from "../../components/CreateCampaign/CreateCampaign.jsx";

import {
    createCompany,
    deleteAllCompanies,
    deleteCompany,
    getCompanies,
    getCompanyFilters,
    updateCompany,
} from "../../api/companiesApi.js";

import {
    AddButton,
    SelectAllButton,
    SelectionInfo,
    SelectionBar,
    SelectionActions,
    RowCheckbox,
    CreateCampaignButton,
    CheckboxCell,
    BulkActionButton,
    ActionsCell,
    CancelButton,
    ClearDatabaseButton,
    CompaniesCard,
    CompaniesSummary,
    CompaniesTable,
    CompaniesToolbar,
    CompanyName,
    CompanyWebsite,
    DeleteButton,
    EmptyCompanies,
    ErrorMessage,
    FilterBar,
    FilterSelect,
    FormField,
    FormGrid,
    FormInput,
    FormLabel,
    LoadingMessage,
    ModalActions,
    ModalCard,
    ModalClose,
    ModalError,
    ModalHeader,
    ModalOverlay,
    ModalSubtitle,
    ModalTitle,
    OpenWebsiteLink,
    PageButton,
    Pagination,
    PaginationControls,
    PaginationDots,
    PaginationInfo,
    ResetFiltersButton,
    RowActionButton,
    SaveButton,
    SearchInput,
    StatusBadge,
    TableWrapper,
    ToolbarActions,
} from "./CompaniesPage.styles.js";

const LIMIT = 25;

const STATUS_LABELS = {
    new: "Новая",
    scanned: "Проверена",
    no_form: "Нет формы",
    error: "Ошибка",
};

const EMPTY_FORM = {
    name: "",
    website: "",
    phone: "",
    city: "",
    region: "",
    category: "",
};

const EMPTY_FILTERS = {
    scanStatus: "",
    category: "",
    city: "",
    region: "",
};

export const CompaniesPage = () => {
    const navigate = useNavigate();

    const [companies, setCompanies] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    categories: [],
    cities: [],
    regions: [],
    locations: [],
    });

    const [loading, setLoading] = useState(true);
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [error, setError] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [modalError, setModalError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [clearingDatabase, setClearingDatabase] = useState(false);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectAllFiltered, setSelectAllFiltered] = useState(false);
    const [excludedIds, setExcludedIds] = useState(new Set());
    const [campaignModalOpen, setCampaignModalOpen] = useState(false);

    const loadFilterOptions = useCallback(async () => {
        setLoadingFilters(true);

        try {
            const data = await getCompanyFilters();

            setFilterOptions({
                statuses:
                    data.statuses ||
                    [],

                categories:
                    data.categories ||
                    [],

                cities:
                    data.cities ||
                    [],

                regions:
                    data.regions ||
                    [],

                locations:
                    data.locations ||
                    [],
            });
        } catch (error) {
            setError(
                error.message ||
                "Не удалось загрузить фильтры"
            );
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

            if (
                data.pagination &&
                page > data.pagination.lastPage
            ) {
                setPage(data.pagination.lastPage);
                return;
            }

            setCompanies(data.companies || []);
            setPagination(data.pagination || null);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось загрузить компании"
            );
        } finally {
            setLoading(false);
        }
    }, [search, filters, page]);

    useEffect(() => {
        loadFilterOptions();
    }, [loadFilterOptions]);

    useEffect(() => {
        const timeout = setTimeout(
            () => loadCompanies(),
            search ? 350 : 0
        );

        return () => clearTimeout(timeout);
    }, [
        search,
        filters,
        page,
        loadCompanies,
    ]);

    const clearSelection = () => {
        setSelectedIds(new Set());
        setSelectAllFiltered(false);
        setExcludedIds(new Set());
    };

    const selectedCount = selectAllFiltered
        ? Math.max((pagination?.total || 0) - excludedIds.size, 0)
        : selectedIds.size;

    const isCompanySelected = (companyId) =>
        selectAllFiltered
            ? !excludedIds.has(companyId)
            : selectedIds.has(companyId);

    const currentPageAllSelected =
        companies.length > 0 &&
        companies.every((company) => isCompanySelected(company.id));

    const toggleCompany = (companyId) => {
        if (selectAllFiltered) {
            setExcludedIds((current) => {
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

        setSelectedIds((current) => {
            const next = new Set(current);

            if (next.has(companyId)) {
                next.delete(companyId);
            } else {
                next.add(companyId);
            }

            return next;
        });
    };

    const toggleCurrentPage = () => {
        const ids = companies.map((company) => company.id);

        if (selectAllFiltered) {
            setExcludedIds((current) => {
                const next = new Set(current);

                if (currentPageAllSelected) {
                    ids.forEach((id) => next.add(id));
                } else {
                    ids.forEach((id) => next.delete(id));
                }

                return next;
            });

            return;
        }

        setSelectedIds((current) => {
            const next = new Set(current);

            if (currentPageAllSelected) {
                ids.forEach((id) => next.delete(id));
            } else {
                ids.forEach((id) => next.add(id));
            }

            return next;
        });
    };

    const selectAllFound = () => {
        setSelectedIds(new Set());
        setExcludedIds(new Set());
        setSelectAllFiltered(true);
    };

    const campaignSelection = selectAllFiltered
        ? {
              mode: "filters",
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
              mode: "ids",
              companyIds: [...selectedIds],
          };

    const suggestedCampaignName =
        [filters.category, filters.city || filters.region]
            .filter(Boolean)
            .join(" — ") || "Новая кампания";

    const handleSearchChange = (event) => {
        clearSelection();
        setSearch(event.target.value);
        setPage(1);
    };

    const handleFilterChange = (event) => {
    const {
        name,
        value,
    } =
        event.target;

    clearSelection();

    setFilters(
        (current) => {
            if (
                name ===
                "region"
            ) {
                if (!value) {
                    return {
                        ...current,

                        region:
                            "",

                        city:
                            "",
                    };
                }
                const cityBelongsToRegion =
                    !current.city ||
                    filterOptions.locations
                        .some(
                            (
                                location
                            ) =>
                                location.city ===
                                    current.city &&
                                location.region ===
                                    value
                        );

                return {
                    ...current,

                    region:
                        value,
                    city:
                        cityBelongsToRegion
                            ? current.city
                            : "",
                };
            }

            if (
                name ===
                "city"
            ) {
                if (!value) {
                    return {
                        ...current,

                        city:
                            "",
                    };
                }
                const matches =
                    filterOptions.locations
                        .filter(
                            (
                                location
                            ) =>
                                location.city ===
                                value
                        );

                const currentRegionMatch =
                    matches.find(
                        (
                            location
                        ) =>
                            location.region ===
                            current.region
                    );

                const detectedRegion =
                    currentRegionMatch
                        ?.region ||
                    matches[0]
                        ?.region ||
                    "";

                return {
                    ...current,

                    city:
                        value,

                    region:
                        detectedRegion,
                };
            }

            return {
                ...current,

                [name]:
                    value,
            };
        }
    );

    setPage(1);
};

    const resetFilters = () => {
        clearSelection();
        setSearch("");
        setFilters(EMPTY_FILTERS);
        setPage(1);
    };

    const hasActiveFilters = Boolean(
        search ||
        filters.scanStatus ||
        filters.category ||
        filters.city ||
        filters.region
    );

    const availableCities =
    filters.region
        ? [
              ...new Set(
                  (filterOptions.locations || [])
                      .filter(
                          (location) =>
                              location.region ===
                              filters.region
                      )
                      .map(
                          (location) =>
                              location.city
                      )
              ),
          ].sort(
              (a, b) =>
                  a.localeCompare(
                      b,
                      "ru"
                  )
          )
        : filterOptions.cities || [];

    const openCreateModal = () => {
        setEditingCompany(null);
        setForm(EMPTY_FORM);
        setModalError(null);
        setModalOpen(true);
    };

    const openEditModal = (company) => {
        setEditingCompany(company);

        setForm({
            name: company.name || "",
            website: company.website || "",
            phone: company.phone || "",
            city: company.city || "",
            region: company.region || "",
            category: company.category || "",
        });

        setModalError(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingCompany(null);
        setForm(EMPTY_FORM);
        setModalError(null);
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim()) {
            setModalError(
                "Введите название компании"
            );
            return;
        }

        setSaving(true);
        setModalError(null);

        try {
            if (editingCompany) {
                await updateCompany(
                    editingCompany.id,
                    form
                );
            } else {
                await createCompany(form);
            }

            setModalOpen(false);
            setEditingCompany(null);
            setForm(EMPTY_FORM);

            await Promise.all([
                loadCompanies(),
                loadFilterOptions(),
            ]);
        } catch (error) {
            setModalError(
                error.message ||
                "Не удалось сохранить компанию"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (company) => {
        const confirmed = window.confirm(
            `Удалить компанию «${company.name}»?`
        );

        if (!confirmed) return;

        setDeletingId(company.id);
        setError(null);

        try {
            await deleteCompany(company.id);

            setSelectedIds((current) => {
                const next = new Set(current);
                next.delete(company.id);
                return next;
            });

            setExcludedIds((current) => {
                const next = new Set(current);
                next.delete(company.id);
                return next;
            });

            await Promise.all([
                loadCompanies(),
                loadFilterOptions(),
            ]);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось удалить компанию"
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearDatabase = async () => {
        const confirmed = window.confirm(
            "Удалить ВСЕ компании из LeadBot?\n\nЭто действие нельзя отменить."
        );

        if (!confirmed) return;

        const confirmation = window.prompt(
            "Для подтверждения напишите УДАЛИТЬ"
        );

        if (confirmation !== "УДАЛИТЬ") {
            return;
        }

        setClearingDatabase(true);
        setError(null);

        try {
            const result = await deleteAllCompanies();

            clearSelection();
            resetFilters();

            await Promise.all([
                loadCompanies(),
                loadFilterOptions(),
            ]);

            window.alert(
                `База очищена.\nУдалено компаний: ${result.deleted}`
            );
        } catch (error) {
            setError(
                error.message ||
                "Не удалось очистить базу"
            );
        } finally {
            setClearingDatabase(false);
        }
    };

    const getVisiblePages = () => {
        if (!pagination) return [];

        const current = pagination.page;
        const last = pagination.lastPage;

        if (last <= 7) {
            return Array.from(
                { length: last },
                (_, index) => index + 1
            );
        }

        const pages = [1];

        if (current > 4) {
            pages.push("left-dots");
        }

        const start = Math.max(
            2,
            current - 1
        );

        const end = Math.min(
            last - 1,
            current + 1
        );

        for (
            let number = start;
            number <= end;
            number++
        ) {
            pages.push(number);
        }

        if (current < last - 3) {
            pages.push("right-dots");
        }

        pages.push(last);

        return pages;
    };

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
                        <strong>
                            Компании
                        </strong>

                        <CompaniesSummary>
                            {pagination
                                ? `Найдено: ${pagination.total.toLocaleString(
                                      "ru-RU"
                                  )}`
                                : "Загрузка..."}
                        </CompaniesSummary>
                    </div>

                    <ToolbarActions>
                        <SearchInput
                            value={search}
                            onChange={
                                handleSearchChange
                            }
                            placeholder="Поиск по компании, сайту, городу..."
                        />

                        <ClearDatabaseButton
                            type="button"
                            onClick={
                                handleClearDatabase
                            }
                            disabled={
                                clearingDatabase
                            }
                        >
                            {clearingDatabase
                                ? "Удаляем..."
                                : "Очистить базу"}
                        </ClearDatabaseButton>

                        <CompaniesImport />

                        <AddButton
                            type="button"
                            onClick={
                                openCreateModal
                            }
                        >
                            <span>+</span>
                            Добавить компанию
                        </AddButton>
                    </ToolbarActions>
                </CompaniesToolbar>

                <FilterBar>
                    <FilterSelect
                        name="scanStatus"
                        value={
                            filters.scanStatus
                        }
                        onChange={
                            handleFilterChange
                        }
                        disabled={
                            loadingFilters
                        }
                    >
                        <option value="">
                            Все статусы
                        </option>

                        {(filterOptions.statuses || []).map(
                            (status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {STATUS_LABELS[status] || status}
                                </option>
                            )
                        )}
                    </FilterSelect>

                    <FilterSelect
                        name="category"
                        value={
                            filters.category
                        }
                        onChange={
                            handleFilterChange
                        }
                        disabled={
                            loadingFilters
                        }
                    >
                        <option value="">
                            Все рубрики
                        </option>

                        {(filterOptions.categories || []).map(
                            (category) => (
                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>
                            )
                        )}
                    </FilterSelect>

                    <FilterSelect
                        name="city"
                        value={filters.city}
                        onChange={
                            handleFilterChange
                        }
                        disabled={
                            loadingFilters
                        }
                    >
                        <option value="">
                            Все города
                        </option>

                        {(availableCities || []).map(
                            (city) => (
                                <option
                                    key={city}
                                    value={city}
                                >
                                    {city}
                                </option>
                            )
                        )}
                    </FilterSelect>

                    <FilterSelect
                        name="region"
                        value={
                            filters.region
                        }
                        onChange={
                            handleFilterChange
                        }
                        disabled={
                            loadingFilters
                        }
                    >
                        <option value="">
                            Все регионы
                        </option>

                        {(filterOptions.regions || []).map(
                            (region) => (
                                <option
                                    key={region}
                                    value={region}
                                >
                                    {region}
                                </option>
                            )
                        )}
                    </FilterSelect>

                    {hasActiveFilters && (
                        <ResetFiltersButton
                            type="button"
                            onClick={
                                resetFilters
                            }
                        >
                            Сбросить
                        </ResetFiltersButton>
                    )}
                </FilterBar>

                {selectedCount > 0 && (
                    <SelectionBar>
                        <SelectionInfo>
                            {selectAllFiltered ? "Выбраны все найденные" : "Выбрано"}: {selectedCount.toLocaleString("ru-RU")} компаний
                        </SelectionInfo>

                        <SelectionActions>
                            {!selectAllFiltered &&
                                pagination &&
                                pagination.total > selectedCount && (
                                    <SelectAllButton
                                        type="button"
                                        onClick={selectAllFound}
                                    >
                                        Выбрать все найденные ({pagination.total.toLocaleString("ru-RU")})
                                    </SelectAllButton>
                                )}

                            <BulkActionButton
                                type="button"
                                onClick={clearSelection}
                            >
                                Снять выбор
                            </BulkActionButton>

                            <CreateCampaignButton
                                type="button"
                                onClick={() => setCampaignModalOpen(true)}
                            >
                                Создать кампанию
                            </CreateCampaignButton>
                        </SelectionActions>
                    </SelectionBar>
                )}

                {error && (
                    <ErrorMessage>
                        {error}
                    </ErrorMessage>
                )}

                <CompaniesCard>
                    {loading ? (
                        <LoadingMessage>
                            Загружаем компании...
                        </LoadingMessage>
                    ) : !companies.length ? (
                        <EmptyCompanies>
                            <strong>
                                Компании не найдены
                            </strong>

                            <span>
                                Измените фильтры или добавьте компанию.
                            </span>
                        </EmptyCompanies>
                    ) : (
                        <TableWrapper>
                            <CompaniesTable>
                                <thead>
                                    <tr>
                                        <CheckboxCell as="th">
                                            <RowCheckbox
                                                type="checkbox"
                                                checked={currentPageAllSelected}
                                                onChange={toggleCurrentPage}
                                                aria-label="Выбрать компании на странице"
                                            />
                                        </CheckboxCell>
                                        <th>Компания</th>
                                        <th>Город</th>
                                        <th>Категория</th>
                                        <th>Телефон</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {companies.map(
                                        (company) => (
                                            <tr
                                                key={
                                                    company.id
                                                }
                                            >
                                                <CheckboxCell>
                                                    <RowCheckbox
                                                        type="checkbox"
                                                        checked={isCompanySelected(company.id)}
                                                        onChange={() => toggleCompany(company.id)}
                                                        aria-label={`Выбрать ${company.name}`}
                                                    />
                                                </CheckboxCell>

                                                <td>
                                                    <CompanyName
                                                        title={
                                                            company.name
                                                        }
                                                    >
                                                        {
                                                            company.name
                                                        }
                                                    </CompanyName>

                                                    {company.website && (
                                                        <CompanyWebsite
                                                            href={
                                                                company.website
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            {
                                                                company.domain
                                                            }
                                                            <span>
                                                                ↗
                                                            </span>
                                                        </CompanyWebsite>
                                                    )}
                                                </td>

                                                <td>
                                                    {company.city || "—"}
                                                </td>

                                                <td
                                                    title={
                                                        company.category ||
                                                        ""
                                                    }
                                                >
                                                    {company.category ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    {company.phone ||
                                                        "—"}
                                                </td>

                                                <td>
                                                    <StatusBadge
                                                        $status={
                                                            company.scanStatus
                                                        }
                                                    >
                                                        {STATUS_LABELS[
                                                            company
                                                                .scanStatus
                                                        ] ||
                                                            company.scanStatus}
                                                    </StatusBadge>
                                                </td>

                                                <td>
                                                    <ActionsCell>
                                                        {company.website && (
                                                            <OpenWebsiteLink
                                                                href={
                                                                    company.website
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                Открыть
                                                            </OpenWebsiteLink>
                                                        )}

                                                        <RowActionButton
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    company
                                                                )
                                                            }
                                                        >
                                                            Изменить
                                                        </RowActionButton>

                                                        <DeleteButton
                                                            type="button"
                                                            disabled={
                                                                deletingId ===
                                                                company.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    company
                                                                )
                                                            }
                                                        >
                                                            {deletingId ===
                                                            company.id
                                                                ? "Удаление..."
                                                                : "Удалить"}
                                                        </DeleteButton>
                                                    </ActionsCell>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </CompaniesTable>
                        </TableWrapper>
                    )}
                </CompaniesCard>

                {pagination &&
                    pagination.total > 0 && (
                        <Pagination>
                            <PaginationInfo>
                                Показано{" "}
                                <strong>
                                    {(pagination.page -
                                        1) *
                                        pagination.limit +
                                        1}
                                </strong>
                                {" — "}
                                <strong>
                                    {Math.min(
                                        pagination.page *
                                            pagination.limit,
                                        pagination.total
                                    )}
                                </strong>
                                {" из "}
                                <strong>
                                    {pagination.total.toLocaleString(
                                        "ru-RU"
                                    )}
                                </strong>
                            </PaginationInfo>

                            <PaginationControls>
                                <PageButton
                                    type="button"
                                    disabled={
                                        pagination.page <=
                                        1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.max(
                                                    current -
                                                        1,
                                                    1
                                                )
                                        )
                                    }
                                >
                                    ←
                                </PageButton>

                                {getVisiblePages().map(
                                    (item) => {
                                        if (
                                            typeof item !==
                                            "number"
                                        ) {
                                            return (
                                                <PaginationDots
                                                    key={
                                                        item
                                                    }
                                                >
                                                    …
                                                </PaginationDots>
                                            );
                                        }

                                        return (
                                            <PageButton
                                                key={
                                                    item
                                                }
                                                type="button"
                                                $active={
                                                    item ===
                                                    pagination.page
                                                }
                                                onClick={() =>
                                                    setPage(
                                                        item
                                                    )
                                                }
                                            >
                                                {item}
                                            </PageButton>
                                        );
                                    }
                                )}

                                <PageButton
                                    type="button"
                                    disabled={
                                        pagination.page >=
                                        pagination.lastPage
                                    }
                                    onClick={() =>
                                        setPage(
                                            (current) =>
                                                Math.min(
                                                    current +
                                                        1,
                                                    pagination.lastPage
                                                )
                                        )
                                    }
                                >
                                    →
                                </PageButton>
                            </PaginationControls>
                        </Pagination>
                    )}
            </Content>

            {modalOpen && (
                <ModalOverlay
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <ModalCard>
                        <ModalHeader>
                            <div>
                                <ModalTitle>
                                    {editingCompany
                                        ? "Изменить компанию"
                                        : "Добавить компанию"}
                                </ModalTitle>

                                <ModalSubtitle>
                                    {editingCompany
                                        ? "Измените данные и сохраните изменения"
                                        : "Добавьте компанию в базу LeadBot"}
                                </ModalSubtitle>
                            </div>

                            <ModalClose
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={saving}
                            >
                                ×
                            </ModalClose>
                        </ModalHeader>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >
                            <FormField>
                                <FormLabel>
                                    Название компании *
                                </FormLabel>

                                <FormInput
                                    autoFocus
                                    name="name"
                                    value={
                                        form.name
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="ООО Компания"
                                />
                            </FormField>

                            <FormField>
                                <FormLabel>
                                    Сайт
                                </FormLabel>

                                <FormInput
                                    name="website"
                                    value={
                                        form.website
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="company.ru"
                                />
                            </FormField>

                            <FormGrid>
                                <FormField>
                                    <FormLabel>
                                        Телефон
                                    </FormLabel>

                                    <FormInput
                                        name="phone"
                                        value={
                                            form.phone
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="+7 999 000-00-00"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel>
                                        Город
                                    </FormLabel>

                                    <FormInput
                                        name="city"
                                        value={
                                            form.city
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Москва"
                                    />
                                </FormField>
                            </FormGrid>

                            <FormGrid>
                                <FormField>
                                    <FormLabel>
                                        Регион
                                    </FormLabel>

                                    <FormInput
                                        name="region"
                                        value={
                                            form.region
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Москва"
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel>
                                        Категория
                                    </FormLabel>

                                    <FormInput
                                        name="category"
                                        value={
                                            form.category
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Пожарная безопасность"
                                    />
                                </FormField>
                            </FormGrid>

                            {modalError && (
                                <ModalError>
                                    {modalError}
                                </ModalError>
                            )}

                            <ModalActions>
                                <CancelButton
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={saving}
                                >
                                    Отмена
                                </CancelButton>

                                <SaveButton
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Сохраняем..."
                                        : editingCompany
                                          ? "Сохранить"
                                          : "Добавить"}
                                </SaveButton>
                            </ModalActions>
                        </form>
                    </ModalCard>
                </ModalOverlay>
            )}

            <CreateCampaign
                open={campaignModalOpen}
                onClose={() => setCampaignModalOpen(false)}
                selectedCount={selectedCount}
                selection={campaignSelection}
                suggestedName={suggestedCampaignName}
                onCreated={() => {
                    setCampaignModalOpen(false);
                    clearSelection();
                    navigate("/campaigns");
                }}
            />
        </>
    );
};
