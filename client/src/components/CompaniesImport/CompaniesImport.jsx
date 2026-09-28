import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    analyzeCompaniesImport,
    analyzeCompaniesImportSelection,
    commitCompaniesImport,
    discardCompaniesImport,
    getCompaniesImportRubrics,
    previewCompaniesImport,
} from "../../api/companiesImportApi.js";

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
    PreviewTable,
    PreviewTableWrapper,
    RubricCheckbox,
    RubricCount,
    RubricItem,
    RubricList,
    RubricsColumns,
    RubricsHeader,
    RubricsSearch,
    RubricsSection,
    SelectedInfo,
    StatCard,
    StatLabel,
    StatsGrid,
    StatValue,
} from "./CompaniesImport.styles.js";


const SAVED_CATEGORIES_KEY =
    "leadbot:selectedCategories";

const SAVED_SUBCATEGORIES_KEY =
    "leadbot:selectedSubcategories";


const getSavedValues = (
    key
) => {
    try {
        const value =
            JSON.parse(
                localStorage.getItem(
                    key
                ) ||
                    "[]"
            );

        return Array.isArray(
            value
        )
            ? value
            : [];
    } catch {
        return [];
    }
};


const formatNumber = (
    value
) =>
    Number(
        value ||
        0
    ).toLocaleString(
        "ru-RU"
    );


const matchesSearch = (
    value,
    search
) =>
    value
        .toLowerCase()
        .includes(
            search
                .trim()
                .toLowerCase()
        );


export const CompaniesImport =
    () => {
        const inputRef =
            useRef(null);

        const [
            loading,
            setLoading,
        ] = useState(false);

        const [
            analyzing,
            setAnalyzing,
        ] = useState(false);

        const [
            loadingRubrics,
            setLoadingRubrics,
        ] = useState(false);

        const [
            analyzingSelection,
            setAnalyzingSelection,
        ] = useState(false);


        const [
            importing,
            setImporting,
        ] = useState(false);

        const [
            preview,
            setPreview,
        ] = useState(null);

        const [
            analysis,
            setAnalysis,
        ] = useState(null);

        const [
            rubrics,
            setRubrics,
        ] = useState(null);

        const [
            selectionAnalysis,
            setSelectionAnalysis,
        ] = useState(null);


        const [
            importResult,
            setImportResult,
        ] = useState(null);

        const [
            rubricSearch,
            setRubricSearch,
        ] = useState("");

        const [
            selectedCategories,
            setSelectedCategories,
        ] = useState(
            () =>
                getSavedValues(
                    SAVED_CATEGORIES_KEY
                )
        );

        const [
            selectedSubcategories,
            setSelectedSubcategories,
        ] = useState(
            () =>
                getSavedValues(
                    SAVED_SUBCATEGORIES_KEY
                )
        );

        const [
            error,
            setError,
        ] = useState(null);


        useEffect(
            () => {
                localStorage.setItem(
                    SAVED_CATEGORIES_KEY,
                    JSON.stringify(
                        selectedCategories
                    )
                );
            },
            [
                selectedCategories,
            ]
        );


        useEffect(
            () => {
                localStorage.setItem(
                    SAVED_SUBCATEGORIES_KEY,
                    JSON.stringify(
                        selectedSubcategories
                    )
                );
            },
            [
                selectedSubcategories,
            ]
        );


        const visibleCategories =
            useMemo(
                () =>
                    (
                        rubrics?.categories ||
                        []
                    ).filter(
                        (
                            item
                        ) =>
                            matchesSearch(
                                item.name,
                                rubricSearch
                            )
                    ),
                [
                    rubrics,
                    rubricSearch,
                ]
            );


        const visibleSubcategories =
            useMemo(
                () =>
                    (
                        rubrics?.subcategories ||
                        []
                    ).filter(
                        (
                            item
                        ) =>
                            matchesSearch(
                                item.name,
                                rubricSearch
                            )
                    ),
                [
                    rubrics,
                    rubricSearch,
                ]
            );


        const selectedCount =
            selectedCategories.length +
            selectedSubcategories.length;


        const openFilePicker =
            () => {
                inputRef.current
                    ?.click();
            };


        const resetRubricView =
            () => {
                setRubrics(
                    null
                );

                setRubricSearch(
                    ""
                );

                setSelectionAnalysis(
                    null
                );
            };


        const clearRubricSelection =
            () => {
                setSelectedCategories(
                    []
                );

                setSelectedSubcategories(
                    []
                );

                setSelectionAnalysis(
                    null
                );
            };


        const handleFileChange =
            async (
                event
            ) => {
                const file =
                    event.target
                        .files?.[0];


                if (!file) {
                    return;
                }


                setLoading(
                    true
                );

                setPreview(
                    null
                );

                setAnalysis(
                    null
                );

                setImportResult(
                    null
                );

                resetRubricView();

                setImportResult(
                    null
                );

                setError(
                    null
                );


                try {
                    const data =
                        await previewCompaniesImport(
                            file
                        );

                    setPreview(
                        data
                    );
                } catch (
                    error
                ) {
                    setError(
                        error.message
                    );
                } finally {
                    setLoading(
                        false
                    );

                    event.target.value =
                        "";
                }
            };


        const handleAnalyze =
            async () => {
                if (
                    !preview?.importId
                ) {
                    return;
                }


                setAnalyzing(
                    true
                );

                setError(
                    null
                );


                try {
                    const data =
                        await analyzeCompaniesImport(
                            preview.importId
                        );

                    setAnalysis(
                        data
                    );
                } catch (
                    error
                ) {
                    setError(
                        error.message
                    );
                } finally {
                    setAnalyzing(
                        false
                    );
                }
            };


        const handleLoadRubrics =
            async () => {
                if (
                    !preview?.importId
                ) {
                    return;
                }


                setLoadingRubrics(
                    true
                );

                setError(
                    null
                );


                try {
                    const data =
                        await getCompaniesImportRubrics(
                            preview.importId
                        );

                    setRubrics(
                        data
                    );


                    const categoryNames =
                        new Set(
                            (
                                data.categories ||
                                []
                            ).map(
                                (
                                    item
                                ) =>
                                    item.name
                            )
                        );

                    const subcategoryNames =
                        new Set(
                            (
                                data.subcategories ||
                                []
                            ).map(
                                (
                                    item
                                ) =>
                                    item.name
                            )
                        );


                    setSelectedCategories(
                        (
                            current
                        ) =>
                            current.filter(
                                (
                                    item
                                ) =>
                                    categoryNames.has(
                                        item
                                    )
                            )
                    );

                    setSelectedSubcategories(
                        (
                            current
                        ) =>
                            current.filter(
                                (
                                    item
                                ) =>
                                    subcategoryNames.has(
                                        item
                                    )
                            )
                    );
                } catch (
                    error
                ) {
                    setError(
                        error.message
                    );
                } finally {
                    setLoadingRubrics(
                        false
                    );
                }
            };


        const handleSelectionAnalyze =
            async () => {
                if (
                    !preview?.importId ||
                    selectedCount ===
                        0
                ) {
                    return;
                }


                setAnalyzingSelection(
                    true
                );

                setError(
                    null
                );


                try {
                    const data =
                        await analyzeCompaniesImportSelection({
                            importId:
                                preview.importId,

                            categories:
                                selectedCategories,

                            subcategories:
                                selectedSubcategories,
                        });


                    setSelectionAnalysis(
                        data
                    );
                } catch (
                    error
                ) {
                    setError(
                        error.message
                    );
                } finally {
                    setAnalyzingSelection(
                        false
                    );
                }
            };


        const handleImport =
            async () => {
                if (
                    !preview?.importId ||
                    !selectionAnalysis ||
                    selectionAnalysis.readyToImport <=
                        0
                ) {
                    return;
                }


                setImporting(
                    true
                );

                setError(
                    null
                );


                try {
                    const data =
                        await commitCompaniesImport({
                            importId:
                                preview.importId,

                            categories:
                                selectedCategories,

                            subcategories:
                                selectedSubcategories,
                        });


                    setImportResult(
                        data
                    );
                } catch (
                    error
                ) {
                    setError(
                        error.message
                    );
                } finally {
                    setImporting(
                        false
                    );
                }
            };


        const finishImport =
            () => {
                /*
                 * После реального импорта
                 * перезагружаем CompaniesPage,
                 * чтобы таблица сразу получила
                 * новые данные из SQLite.
                 */
                window.location.reload();
            };


        const toggleValue =
            (
                value,
                setter
            ) => {
                setter(
                    (
                        current
                    ) =>
                        current.includes(
                            value
                        )
                            ? current.filter(
                                  (
                                      item
                                  ) =>
                                      item !==
                                      value
                              )
                            : [
                                  ...current,
                                  value,
                              ]
                );

                setSelectionAnalysis(
                    null
                );
            };


        const closePreview =
            () => {
                if (
                    analyzing ||
                    loadingRubrics ||
                    analyzingSelection ||
                    importing
                ) {
                    return;
                }


                if (
                    preview?.importId &&
                    !importResult
                ) {
                    discardCompaniesImport(
                        preview.importId
                    ).catch(
                        () => {}
                    );
                }


                setPreview(
                    null
                );

                setAnalysis(
                    null
                );

                resetRubricView();

                setError(
                    null
                );
            };


        return (
            <>
                <ImportButton
                    type="button"
                    onClick={
                        openFilePicker
                    }
                    disabled={
                        loading
                    }
                >
                    {loading
                        ? "Читаем файл..."
                        : "Импортировать базу"}
                </ImportButton>


                <HiddenFileInput
                    ref={
                        inputRef
                    }
                    type="file"
                    accept=".xlsx"
                    onChange={
                        handleFileChange
                    }
                />


                {error &&
                    !preview && (
                        <ImportError>
                            {error}
                        </ImportError>
                    )}


                {preview && (
                    <ImportOverlay
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closePreview();
                            }
                        }}
                    >
                        <ImportModal>
                            <ImportHeader>
                                <div>
                                    <ImportTitle>
                                        {importResult
                                            ? "Импорт завершён"
                                            : selectionAnalysis
                                              ? "Выборка готова"
                                              : rubrics
                                              ? "Выбор рубрик"
                                              : analysis
                                                ? "Анализ базы"
                                                : "Предпросмотр импорта"}
                                    </ImportTitle>

                                    <ImportSubtitle>
                                        {importResult
                                            ? "Компании записаны в базу LeadBot и готовы к дальнейшей обработке"
                                            : selectionAnalysis
                                              ? "Точный расчёт компаний по выбранным рубрикам перед импортом"
                                              : rubrics
                                              ? "Выберите рубрики 2ГИС, компании из которых будут использоваться в LeadBot"
                                              : analysis
                                                ? "Полный анализ файла перед выбором нужных компаний"
                                                : "Проверьте структуру базы перед полным анализом"}
                                    </ImportSubtitle>
                                </div>


                                <CloseButton
                                    type="button"
                                    onClick={
                                        closePreview
                                    }
                                    disabled={
                                        analyzing ||
                                        loadingRubrics ||
                                        analyzingSelection ||
                                        importing
                                    }
                                >
                                    ×
                                </CloseButton>
                            </ImportHeader>


                            <FileInfo>
                                <strong>
                                    {preview.originalName}
                                </strong>

                                <span>
                                    {(
                                        preview.fileSize /
                                        1024 /
                                        1024
                                    ).toFixed(
                                        1
                                    )}{" "}
                                    МБ
                                </span>
                            </FileInfo>


                            {!analysis ? (
                                <>
                                    <StatsGrid>
                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    preview.estimatedCompanyRows
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                строк в файле
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {preview.headerRow}
                                            </StatValue>
                                            <StatLabel>
                                                строка заголовков
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    preview.previewStats
                                                        ?.withWebsite
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                с сайтом в preview
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    preview.previewStats
                                                        ?.withoutWebsite
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                без сайта в preview
                                            </StatLabel>
                                        </StatCard>
                                    </StatsGrid>


                                    <PreviewTableWrapper>
                                        <PreviewTable>
                                            <thead>
                                                <tr>
                                                    <th>Компания</th>
                                                    <th>Сайт</th>
                                                    <th>Город</th>
                                                    <th>Рубрика</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {preview.preview
                                                    ?.slice(
                                                        0,
                                                        15
                                                    )
                                                    .map(
                                                        (
                                                            company
                                                        ) => (
                                                            <tr
                                                                key={
                                                                    company.rowNumber
                                                                }
                                                            >
                                                                <td>
                                                                    <strong>
                                                                        {company.name}
                                                                    </strong>
                                                                </td>
                                                                <td>
                                                                    {company.domain ||
                                                                        "—"}
                                                                </td>
                                                                <td>
                                                                    {company.city ||
                                                                        "—"}
                                                                </td>
                                                                <td>
                                                                    {company.category ||
                                                                        "—"}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                            </tbody>
                                        </PreviewTable>
                                    </PreviewTableWrapper>
                                </>
                            ) : importResult ? (
                                <>
                                    <StatsGrid>
                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    importResult.imported
                                                )}
                                            </StatValue>

                                            <StatLabel>
                                                компаний импортировано
                                            </StatLabel>
                                        </StatCard>


                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    importResult.skippedExisting
                                                )}
                                            </StatValue>

                                            <StatLabel>
                                                пропущено: уже были в LeadBot
                                            </StatLabel>
                                        </StatCard>


                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    importResult.duplicateRows
                                                )}
                                            </StatValue>

                                            <StatLabel>
                                                дублей объединено по домену
                                            </StatLabel>
                                        </StatCard>


                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    importResult.totalCompanies
                                                )}
                                            </StatValue>

                                            <StatLabel>
                                                всего компаний теперь в базе
                                            </StatLabel>
                                        </StatCard>
                                    </StatsGrid>


                                    <SelectedInfo>
                                        Импорт завершён успешно. Новые компании получили статус «Новая».
                                    </SelectedInfo>
                                </>
                            ) : selectionAnalysis ? (
                                <>
                                    <StatsGrid>
                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.matchedRows
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                строк соответствуют выбранным рубрикам
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.validWebsiteRows
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                строк с пригодным сайтом
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.withoutWebsite
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                без сайта
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.excludedWebsiteRows
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                исключено сервисов и нецелевых доменов
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.invalidWebsiteRows
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                некорректных сайтов
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.uniqueDomains
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                уникальных пригодных доменов
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.duplicateRows
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                дублей по домену
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.existingDomains
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                уже есть в LeadBot
                                            </StatLabel>
                                        </StatCard>

                                        <StatCard>
                                            <StatValue>
                                                {formatNumber(
                                                    selectionAnalysis.readyToImport
                                                )}
                                            </StatValue>
                                            <StatLabel>
                                                реально готово к импорту
                                            </StatLabel>
                                        </StatCard>
                                    </StatsGrid>


                                    <SelectedInfo>
                                        Выбрано рубрик и подрубрик: {selectedCount}
                                    </SelectedInfo>


                                    {selectionAnalysis.topExcludedDomains
                                        ?.length >
                                        0 && (
                                        <>
                                            <ImportSubtitle>
                                                Исключённые домены в выбранной выборке
                                            </ImportSubtitle>

                                            <PreviewTableWrapper>
                                                <PreviewTable>
                                                    <thead>
                                                        <tr>
                                                            <th>Домен</th>
                                                            <th>Строк</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectionAnalysis.topExcludedDomains.map(
                                                            (
                                                                item
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        item.domain
                                                                    }
                                                                >
                                                                    <td>
                                                                        <strong>
                                                                            {item.domain}
                                                                        </strong>
                                                                    </td>
                                                                    <td>
                                                                        {formatNumber(
                                                                            item.count
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </PreviewTable>
                                            </PreviewTableWrapper>
                                        </>
                                    )}
                                </>
                            ) : rubrics ? (
                                <>
                                    <RubricsHeader>
                                        <div>
                                            <strong>
                                                Найдено: {formatNumber(
                                                    rubrics.totals
                                                        ?.categories
                                                )}{" "}
                                                рубрик и {formatNumber(
                                                    rubrics.totals
                                                        ?.subcategories
                                                )}{" "}
                                                подрубрик
                                            </strong>

                                            <SelectedInfo>
                                                Выбрано: {selectedCount}. Выбор сохраняется автоматически.
                                            </SelectedInfo>
                                        </div>

                                        <RubricsSearch
                                            value={
                                                rubricSearch
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setRubricSearch(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="Например: пожарная безопасность"
                                        />
                                    </RubricsHeader>


                                    <RubricsColumns>
                                        <RubricsSection>
                                            <h3>Рубрики</h3>

                                            <RubricList>
                                                {visibleCategories.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <RubricItem
                                                            key={
                                                                item.name
                                                            }
                                                        >
                                                            <RubricCheckbox
                                                                type="checkbox"
                                                                checked={
                                                                    selectedCategories.includes(
                                                                        item.name
                                                                    )
                                                                }
                                                                onChange={() =>
                                                                    toggleValue(
                                                                        item.name,
                                                                        setSelectedCategories
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                {item.name}
                                                            </span>
                                                            <RubricCount>
                                                                {formatNumber(
                                                                    item.count
                                                                )}
                                                            </RubricCount>
                                                        </RubricItem>
                                                    )
                                                )}
                                            </RubricList>
                                        </RubricsSection>


                                        <RubricsSection>
                                            <h3>Подрубрики</h3>

                                            <RubricList>
                                                {visibleSubcategories.map(
                                                    (
                                                        item
                                                    ) => (
                                                        <RubricItem
                                                            key={
                                                                item.name
                                                            }
                                                        >
                                                            <RubricCheckbox
                                                                type="checkbox"
                                                                checked={
                                                                    selectedSubcategories.includes(
                                                                        item.name
                                                                    )
                                                                }
                                                                onChange={() =>
                                                                    toggleValue(
                                                                        item.name,
                                                                        setSelectedSubcategories
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                {item.name}
                                                            </span>
                                                            <RubricCount>
                                                                {formatNumber(
                                                                    item.count
                                                                )}
                                                            </RubricCount>
                                                        </RubricItem>
                                                    )
                                                )}
                                            </RubricList>
                                        </RubricsSection>
                                    </RubricsColumns>
                                </>
                            ) : (
                                <StatsGrid>
                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.totalRows
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            всего компаний
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.validWebsiteRows
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            строк с рабочим адресом сайта
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.withoutWebsite
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            действительно без сайта
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.invalidWebsiteRows
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            некорректный сайт
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.excludedWebsiteRows
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            исключено: мессенджеры, сервисы и госдомены
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.uniqueDomains
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            уникальных доменов
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.duplicateRows
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            дублей по домену
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.existingDomains
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            уже есть в LeadBot
                                        </StatLabel>
                                    </StatCard>

                                    <StatCard>
                                        <StatValue>
                                            {formatNumber(
                                                analysis.readyToImport
                                            )}
                                        </StatValue>
                                        <StatLabel>
                                            пригодных уникальных доменов
                                        </StatLabel>
                                    </StatCard>
                                </StatsGrid>
                            )}


                            {error && (
                                <ImportError>
                                    {error}
                                </ImportError>
                            )}


                            <ModalActions>
                                {importResult ? (
                                    <ContinueButton
                                        type="button"
                                        onClick={
                                            finishImport
                                        }
                                    >
                                        Готово
                                    </ContinueButton>
                                ) : selectionAnalysis ? (
                                    <>
                                        <CancelButton
                                            type="button"
                                            onClick={() =>
                                                setSelectionAnalysis(
                                                    null
                                                )
                                            }
                                        >
                                            Назад к рубрикам
                                        </CancelButton>

                                        <ContinueButton
                                            type="button"
                                            onClick={
                                                handleImport
                                            }
                                            disabled={
                                                importing ||
                                                selectionAnalysis.readyToImport <=
                                                    0
                                            }
                                        >
                                            {importing
                                                ? "Импортируем компании..."
                                                : `Импортировать ${formatNumber(
                                                      selectionAnalysis.readyToImport
                                                  )}`}
                                        </ContinueButton>
                                    </>
                                ) : rubrics ? (
                                    <>
                                        <CancelButton
                                            type="button"
                                            onClick={
                                                clearRubricSelection
                                            }
                                            disabled={
                                                selectedCount ===
                                                0
                                            }
                                        >
                                            Очистить выбор
                                        </CancelButton>

                                        <CancelButton
                                            type="button"
                                            onClick={
                                                resetRubricView
                                            }
                                        >
                                            Назад
                                        </CancelButton>

                                        <ContinueButton
                                            type="button"
                                            onClick={
                                                handleSelectionAnalyze
                                            }
                                            disabled={
                                                selectedCount ===
                                                    0 ||
                                                analyzingSelection
                                            }
                                        >
                                            {analyzingSelection
                                                ? "Считаем выбранные компании..."
                                                : `Рассчитать выборку (${selectedCount})`}
                                        </ContinueButton>
                                    </>
                                ) : (
                                    <>
                                        <CancelButton
                                            type="button"
                                            onClick={
                                                closePreview
                                            }
                                            disabled={
                                                analyzing ||
                                                loadingRubrics
                                            }
                                        >
                                            Закрыть
                                        </CancelButton>

                                        {!analysis ? (
                                            <ContinueButton
                                                type="button"
                                                onClick={
                                                    handleAnalyze
                                                }
                                                disabled={
                                                    analyzing
                                                }
                                            >
                                                {analyzing
                                                    ? "Анализируем весь файл..."
                                                    : "Анализировать весь файл"}
                                            </ContinueButton>
                                        ) : (
                                            <ContinueButton
                                                type="button"
                                                onClick={
                                                    handleLoadRubrics
                                                }
                                                disabled={
                                                    loadingRubrics
                                                }
                                            >
                                                {loadingRubrics
                                                    ? "Читаем рубрики..."
                                                    : "Выбрать рубрики"}
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
    };
