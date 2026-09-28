import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { Content } from "../../App.styles.js";
import { Header } from "../../components/Header/Header.jsx";

import {
    deleteCampaign,
    getCampaignCompanies,
    getCampaignCompanyScanResult,
    getCampaigns,
    pauseCampaignScan,
    retryCampaignScanErrors,
    startCampaignScan,
    updateCampaignStatus,
} from "../../api/campaignsApi.js";

import {
    ActionButton,
    CampaignActions,
    CampaignCard,
    CampaignGrid,
    CampaignMeta,
    CampaignName,
    CampaignText,
    CaptchaBadge,
    CompanyActions,
    CompanyLine,
    CompanyList,
    CompanyMeta,
    DeleteButton,
    EmptyState,
    ErrorBox,
    FormBlock,
    FormFieldList,
    HeaderRow,
    LoadingBox,
    Modal,
    ModalClose,
    ModalOverlay,
    ModalTitle,
    PaginationActions,
    ProgressBar,
    ProgressFill,
    ProgressMeta,
    ResultLink,
    ResultModal,
    ResultSection,
    ScanHint,
    SecondaryButton,
    Stat,
    Stats,
    StatusBadge,
} from "./CampaignsPage.styles.js";

const STATUS_LABELS = {
    draft: "Черновик",
    ready: "Готова к проверке",
    running: "Сканирование",
    paused: "Пауза",
    completed: "Проверка завершена",
};

const PROCESSING_LABELS = {
    pending: "Ожидает",
    scanning: "Сканируется",
    form_found: "Форма найдена",
    no_form: "Нет формы",
    no_site: "Нет сайта",
    error: "Ошибка",
    test_filled: "Тест заполнен",
    sent: "Отправлено",
    skipped: "Пропущено",
};

const formatDate = (value) => {
    if (!value) return "—";

    const parsed = new Date(`${value.replace(" ", "T")}Z`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatNumber = (value) =>
    Number(value || 0).toLocaleString("ru-RU");

const getProcessedCount = (campaign) =>
    Math.max(
        Number(campaign.companyCount || 0) -
            Number(campaign.pendingCount || 0) -
            Number(campaign.scanningCount || 0),
        0
    );

const getProgress = (campaign) => {
    const total = Number(campaign.companyCount || 0);

    if (!total) return 0;

    return Math.min(
        Math.round((getProcessedCount(campaign) / total) * 100),
        100
    );
};

export const CampaignsPage = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [actionId, setActionId] = useState(null);

    const [details, setDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsPage, setDetailsPage] = useState(1);

    const [scanResult, setScanResult] = useState(null);
    const [scanResultLoading, setScanResultLoading] = useState(false);

    const loadCampaigns = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }

        try {
            const data = await getCampaigns();
            setCampaigns(data || []);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось загрузить кампании"
            );
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    const loadDetails = useCallback(
        async (campaignId, page = 1, silent = false) => {
            if (!silent) {
                setDetailsLoading(true);
            }

            try {
                const result = await getCampaignCompanies(
                    campaignId,
                    {
                        page,
                        limit: 50,
                    }
                );

                const campaign = campaigns.find(
                    (item) => item.id === campaignId
                );

                setDetails((current) => ({
                    campaign:
                        campaign ||
                        current?.campaign ||
                        { id: campaignId },
                    ...result,
                }));
            } catch (error) {
                setError(
                    error.message ||
                    "Не удалось открыть компании кампании"
                );
            } finally {
                if (!silent) {
                    setDetailsLoading(false);
                }
            }
        },
        [campaigns]
    );

    useEffect(() => {
        loadCampaigns();
    }, [loadCampaigns]);

    const hasRunningCampaign = useMemo(
        () => campaigns.some(
            (campaign) => campaign.status === "running"
        ),
        [campaigns]
    );

    useEffect(() => {
        if (!hasRunningCampaign) {
            return undefined;
        }

        const interval = setInterval(async () => {
            await loadCampaigns(true);

            if (details?.campaign?.id) {
                loadDetails(
                    details.campaign.id,
                    detailsPage,
                    true
                );
            }
        }, 2500);

        return () => clearInterval(interval);
    }, [
        hasRunningCampaign,
        loadCampaigns,
        loadDetails,
        details?.campaign?.id,
        detailsPage,
    ]);

    useEffect(() => {
        if (!details?.campaign?.id) return;

        const fresh = campaigns.find(
            (campaign) =>
                campaign.id === details.campaign.id
        );

        if (fresh) {
            setDetails((current) => ({
                ...current,
                campaign: fresh,
            }));
        }
    }, [campaigns, details?.campaign?.id]);

    const handleStatus = async (campaign, status) => {
        setActionId(campaign.id);
        setError(null);

        try {
            await updateCampaignStatus(
                campaign.id,
                status
            );

            await loadCampaigns(true);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось изменить статус"
            );
        } finally {
            setActionId(null);
        }
    };

    const handleStart = async (campaign) => {
        setActionId(campaign.id);
        setError(null);

        try {
            await startCampaignScan(campaign.id);
            await loadCampaigns(true);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось запустить проверку"
            );
        } finally {
            setActionId(null);
        }
    };

    const handlePause = async (campaign) => {
        setActionId(campaign.id);
        setError(null);

        try {
            await pauseCampaignScan(campaign.id);
            await loadCampaigns(true);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось поставить проверку на паузу"
            );
        } finally {
            setActionId(null);
        }
    };

    const handleRetryErrors = async (campaign) => {
        setActionId(campaign.id);
        setError(null);

        try {
            await retryCampaignScanErrors(campaign.id);
            await loadCampaigns(true);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось повторить ошибки"
            );
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (campaign) => {
        if (campaign.status === "running") {
            setError(
                "Сначала поставьте сканирование на паузу, затем удаляйте кампанию."
            );
            return;
        }

        if (
            !window.confirm(
                `Удалить кампанию «${campaign.name}»?`
            )
        ) {
            return;
        }

        setActionId(campaign.id);
        setError(null);

        try {
            await deleteCampaign(campaign.id);

            if (details?.campaign?.id === campaign.id) {
                setDetails(null);
            }

            await loadCampaigns(true);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось удалить кампанию"
            );
        } finally {
            setActionId(null);
        }
    };

    const openDetails = async (campaign) => {
        setDetailsPage(1);
        setDetailsLoading(true);
        setError(null);

        try {
            const result = await getCampaignCompanies(
                campaign.id,
                {
                    page: 1,
                    limit: 50,
                }
            );

            setDetails({
                campaign,
                ...result,
            });
        } catch (error) {
            setError(
                error.message ||
                "Не удалось открыть компании кампании"
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const changeDetailsPage = async (nextPage) => {
        if (!details?.campaign?.id) return;

        setDetailsPage(nextPage);

        await loadDetails(
            details.campaign.id,
            nextPage
        );
    };

    const openScanResult = async (company) => {
        if (!details?.campaign?.id) return;

        setScanResultLoading(true);
        setError(null);

        try {
            const result = await getCampaignCompanyScanResult(
                details.campaign.id,
                company.id
            );

            setScanResult(result);
        } catch (error) {
            setError(
                error.message ||
                "Не удалось открыть результат сканирования"
            );
        } finally {
            setScanResultLoading(false);
        }
    };

    const totalCompanies = campaigns.reduce(
        (sum, campaign) =>
            sum + Number(campaign.companyCount || 0),
        0
    );

    const runningCount = campaigns.filter(
        (campaign) => campaign.status === "running"
    ).length;

    return (
        <>
            <Header
                eyebrow="LeadBot"
                title="Кампании"
                subtitle="Автоматическая проверка сайтов и поиск форм обратной связи"
            />

            <Content>
                <HeaderRow>
                    <Stats>
                        <Stat>
                            <strong>
                                {formatNumber(campaigns.length)}
                            </strong>
                            <span>кампаний</span>
                        </Stat>

                        <Stat>
                            <strong>
                                {formatNumber(totalCompanies)}
                            </strong>
                            <span>компаний в выборках</span>
                        </Stat>

                        <Stat>
                            <strong>
                                {formatNumber(runningCount)}
                            </strong>
                            <span>сканируются сейчас</span>
                        </Stat>
                    </Stats>
                </HeaderRow>

                <ScanHint>
                    LeadBot проверяет максимум 2 сайта одновременно. Формы не отправляются и CAPTCHA автоматически не обходится.
                </ScanHint>

                {error && <ErrorBox>{error}</ErrorBox>}

                {loading ? (
                    <LoadingBox>
                        Загружаем кампании...
                    </LoadingBox>
                ) : campaigns.length === 0 ? (
                    <EmptyState>
                        <strong>
                            Кампаний пока нет
                        </strong>

                        <span>
                            Перейдите в «База компаний», отметьте нужные компании и создайте кампанию.
                        </span>
                    </EmptyState>
                ) : (
                    <CampaignGrid>
                        {campaigns.map((campaign) => {
                            const progress = getProgress(campaign);
                            const busy = actionId === campaign.id;

                            return (
                                <CampaignCard key={campaign.id}>
                                    <CampaignMeta>
                                        <StatusBadge $status={campaign.status}>
                                            {STATUS_LABELS[campaign.status] || campaign.status}
                                        </StatusBadge>

                                        <span>
                                            {formatDate(campaign.createdAt)}
                                        </span>
                                    </CampaignMeta>

                                    <CampaignName>
                                        {campaign.name}
                                    </CampaignName>

                                    <CampaignText title={campaign.message}>
                                        {campaign.message}
                                    </CampaignText>

                                    <ProgressMeta>
                                        <span>
                                            Проверено {formatNumber(getProcessedCount(campaign))} из {formatNumber(campaign.companyCount)}
                                        </span>

                                        <strong>
                                            {progress}%
                                        </strong>
                                    </ProgressMeta>

                                    <ProgressBar>
                                        <ProgressFill $value={progress} />
                                    </ProgressBar>

                                    <Stats>
                                        <Stat>
                                            <strong>
                                                {formatNumber(campaign.formFoundCount)}
                                            </strong>
                                            <span>форм найдено</span>
                                        </Stat>

                                        <Stat>
                                            <strong>
                                                {formatNumber(campaign.noFormCount)}
                                            </strong>
                                            <span>без формы</span>
                                        </Stat>

                                        <Stat>
                                            <strong>
                                                {formatNumber(campaign.errorCount)}
                                            </strong>
                                            <span>ошибок</span>
                                        </Stat>

                                        <Stat>
                                            <strong>
                                                {formatNumber(campaign.captchaCount)}
                                            </strong>
                                            <span>с CAPTCHA</span>
                                        </Stat>
                                    </Stats>

                                    <CampaignActions>
                                        <ActionButton
                                            type="button"
                                            onClick={() => openDetails(campaign)}
                                            disabled={detailsLoading}
                                        >
                                            Компании
                                        </ActionButton>

                                        {campaign.status === "draft" && (
                                            <ActionButton
                                                type="button"
                                                onClick={() =>
                                                    handleStatus(
                                                        campaign,
                                                        "ready"
                                                    )
                                                }
                                                disabled={busy}
                                            >
                                                Готова к проверке
                                            </ActionButton>
                                        )}

                                        {campaign.status === "running" ? (
                                            <ActionButton
                                                type="button"
                                                onClick={() =>
                                                    handlePause(campaign)
                                                }
                                                disabled={busy}
                                            >
                                                {busy ? "Ставим на паузу..." : "Пауза"}
                                            </ActionButton>
                                        ) : (
                                            campaign.pendingCount > 0 &&
                                            campaign.status !== "draft" && (
                                                <ActionButton
                                                    type="button"
                                                    onClick={() =>
                                                        handleStart(campaign)
                                                    }
                                                    disabled={busy}
                                                >
                                                    {busy
                                                        ? "Запускаем..."
                                                        : campaign.status === "paused"
                                                          ? "Продолжить проверку"
                                                          : "Запустить проверку"}
                                                </ActionButton>
                                            )
                                        )}

                                        {campaign.errorCount > 0 &&
                                            campaign.status !== "running" && (
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={() =>
                                                        handleRetryErrors(campaign)
                                                    }
                                                    disabled={busy}
                                                >
                                                    Повторить ошибки ({formatNumber(campaign.errorCount)})
                                                </SecondaryButton>
                                            )}

                                        <DeleteButton
                                            type="button"
                                            onClick={() => handleDelete(campaign)}
                                            disabled={busy || campaign.status === "running"}
                                        >
                                            Удалить
                                        </DeleteButton>
                                    </CampaignActions>
                                </CampaignCard>
                            );
                        })}
                    </CampaignGrid>
                )}
            </Content>

            {details && (
                <ModalOverlay
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setDetails(null);
                        }
                    }}
                >
                    <Modal>
                        <ModalTitle>
                            <div>
                                <strong>
                                    {details.campaign.name}
                                </strong>

                                <span>
                                    Страница {details.pagination.page} из {details.pagination.lastPage}. Всего {formatNumber(details.pagination.total)} компаний.
                                </span>
                            </div>

                            <ModalClose
                                type="button"
                                onClick={() => setDetails(null)}
                            >
                                ×
                            </ModalClose>
                        </ModalTitle>

                        <CompanyList>
                            {details.companies.map((company) => (
                                <CompanyLine key={company.id}>
                                    <div>
                                        <strong>
                                            {company.companyName}
                                        </strong>

                                        <CompanyMeta>
                                            <span>
                                                {company.domain || company.website || "Нет сайта"}
                                            </span>

                                            {company.scanFormsCount > 0 && (
                                                <span>
                                                    Форм: {company.scanFormsCount}
                                                </span>
                                            )}

                                            {company.bestFormScore > 0 && (
                                                <span>
                                                    Лучший рейтинг: {company.bestFormScore}%
                                                </span>
                                            )}
                                        </CompanyMeta>

                                        {company.scanError && (
                                            <ErrorBox title={company.scanError}>
                                                {company.scanError}
                                            </ErrorBox>
                                        )}
                                    </div>

                                    <CompanyActions>
                                        {company.hasCaptcha && (
                                            <CaptchaBadge>
                                                CAPTCHA
                                            </CaptchaBadge>
                                        )}

                                        <StatusBadge $status={company.processingStatus}>
                                            {PROCESSING_LABELS[company.processingStatus] || company.processingStatus}
                                        </StatusBadge>

                                        {[
                                            "form_found",
                                            "no_form",
                                            "error",
                                            "test_filled",
                                        ].includes(company.processingStatus) && (
                                            <ActionButton
                                                type="button"
                                                onClick={() => openScanResult(company)}
                                                disabled={scanResultLoading}
                                            >
                                                Результат
                                            </ActionButton>
                                        )}
                                    </CompanyActions>
                                </CompanyLine>
                            ))}
                        </CompanyList>

                        {details.pagination.lastPage > 1 && (
                            <PaginationActions>
                                <ActionButton
                                    type="button"
                                    disabled={
                                        detailsLoading ||
                                        details.pagination.page <= 1
                                    }
                                    onClick={() =>
                                        changeDetailsPage(
                                            details.pagination.page - 1
                                        )
                                    }
                                >
                                    ← Назад
                                </ActionButton>

                                <span>
                                    {details.pagination.page} / {details.pagination.lastPage}
                                </span>

                                <ActionButton
                                    type="button"
                                    disabled={
                                        detailsLoading ||
                                        details.pagination.page >=
                                            details.pagination.lastPage
                                    }
                                    onClick={() =>
                                        changeDetailsPage(
                                            details.pagination.page + 1
                                        )
                                    }
                                >
                                    Далее →
                                </ActionButton>
                            </PaginationActions>
                        )}
                    </Modal>
                </ModalOverlay>
            )}

            {scanResult && (
                <ModalOverlay
                    $higher
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setScanResult(null);
                        }
                    }}
                >
                    <ResultModal>
                        <ModalTitle>
                            <div>
                                <strong>
                                    {scanResult.companyName}
                                </strong>

                                <span>
                                    {scanResult.domain || scanResult.website}
                                </span>
                            </div>

                            <ModalClose
                                type="button"
                                onClick={() => setScanResult(null)}
                            >
                                ×
                            </ModalClose>
                        </ModalTitle>

                        <ResultSection>
                            <Stats>
                                <Stat>
                                    <strong>
                                        {scanResult.scanFormsCount}
                                    </strong>
                                    <span>форм найдено</span>
                                </Stat>

                                <Stat>
                                    <strong>
                                        {scanResult.bestFormScore}%
                                    </strong>
                                    <span>лучший рейтинг</span>
                                </Stat>

                                <Stat>
                                    <strong>
                                        {scanResult.hasCaptcha ? "Да" : "Нет"}
                                    </strong>
                                    <span>CAPTCHA</span>
                                </Stat>
                            </Stats>

                            {scanResult.scanPageUrl && (
                                <ResultLink
                                    href={scanResult.scanPageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Открыть страницу с формой ↗
                                </ResultLink>
                            )}

                            {scanResult.scanError && (
                                <ErrorBox>
                                    {scanResult.scanError}
                                </ErrorBox>
                            )}

                            {scanResult.hasCaptcha && (
                                <ScanHint>
                                    На странице обнаружены признаки CAPTCHA. LeadBot не пытается обходить её автоматически.
                                </ScanHint>
                            )}

                            {scanResult.forms?.length > 0 ? (
                                scanResult.forms.map((form, index) => (
                                    <FormBlock key={`${form.pageUrl}-${index}`}>
                                        <div>
                                            <strong>
                                                Форма {index + 1}
                                            </strong>

                                            <span>
                                                {form.source === "popup" ? "POPUP" : "PAGE"} · рейтинг {form.score || 0}%
                                            </span>
                                        </div>

                                        {form.pageUrl && (
                                            <ResultLink
                                                href={form.pageUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {form.pageUrl}
                                            </ResultLink>
                                        )}

                                        <FormFieldList>
                                            {(form.fields || []).map((field, fieldIndex) => (
                                                <span key={`${field.name}-${fieldIndex}`}>
                                                    {field.label || field.placeholder || field.name || field.type || "Поле"}
                                                    {field.required ? " *" : ""}
                                                </span>
                                            ))}
                                        </FormFieldList>
                                    </FormBlock>
                                ))
                            ) : (
                                <EmptyState>
                                    <strong>
                                        Формы не найдены
                                    </strong>

                                    <span>
                                        Сайт был проверен, но подходящей формы обратной связи LeadBot не обнаружил.
                                    </span>
                                </EmptyState>
                            )}
                        </ResultSection>
                    </ResultModal>
                </ModalOverlay>
            )}
        </>
    );
};
