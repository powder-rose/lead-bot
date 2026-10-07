import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  deleteCampaign,
  getCampaignCompanies,
  getCampaignCompanyScanResult,
  getCampaigns,
  pauseCampaignScan,
  retryCampaignScanErrors,
  startCampaignScan,
  updateCampaignStatus,
} from '../../api/campaignsApi';

export const STATUS_LABELS = {
  draft: 'Черновик',
  ready: 'Готова к проверке',
  running: 'Сканирование',
  paused: 'Пауза',
  completed: 'Проверка завершена',
};

export const PROCESSING_LABELS = {
  pending: 'Ожидает',
  scanning: 'Сканируется',
  form_found: 'Форма найдена',
  no_form: 'Нет формы',
  no_site: 'Нет сайта',
  error: 'Ошибка',
  test_filled: 'Тест заполнен',
  sent: 'Отправлено',
  skipped: 'Пропущено',
};

const DETAILS_PAGE_SIZE = 50;
const POLLING_INTERVAL_MS = 2500;

export function formatCampaignDate(value) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(`${value.replace(' ', 'T')}Z`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCampaignNumber(value) {
  return Number(value || 0).toLocaleString('ru-RU');
}

export function getProcessedCount(campaign) {
  return Math.max(
    Number(campaign.companyCount || 0) -
      Number(campaign.pendingCount || 0) -
      Number(campaign.scanningCount || 0),
    0,
  );
}

export function getCampaignProgress(campaign) {
  const total = Number(campaign.companyCount || 0);

  if (!total) {
    return 0;
  }

  return Math.min(
    Math.round((getProcessedCount(campaign) / total) * 100),
    100,
  );
}

export function useCampaigns() {
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
    } catch (requestError) {
      setError(requestError.message || 'Не удалось загрузить кампании');
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
        const result = await getCampaignCompanies(campaignId, {
          page,
          limit: DETAILS_PAGE_SIZE,
        });

        const campaign = campaigns.find(item => item.id === campaignId);

        setDetails(current => ({
          campaign: campaign || current?.campaign || { id: campaignId },
          ...result,
        }));
      } catch (requestError) {
        setError(
          requestError.message || 'Не удалось открыть компании кампании',
        );
      } finally {
        if (!silent) {
          setDetailsLoading(false);
        }
      }
    },
    [campaigns],
  );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const hasRunningCampaign = useMemo(
    () => campaigns.some(campaign => campaign.status === 'running'),
    [campaigns],
  );

  useEffect(() => {
    if (!hasRunningCampaign) {
      return undefined;
    }

    const interval = setInterval(async () => {
      await loadCampaigns(true);

      if (details?.campaign?.id) {
        loadDetails(details.campaign.id, detailsPage, true);
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [
    hasRunningCampaign,
    loadCampaigns,
    loadDetails,
    details?.campaign?.id,
    detailsPage,
  ]);

  useEffect(() => {
    if (!details?.campaign?.id) {
      return;
    }

    const fresh = campaigns.find(
      campaign => campaign.id === details.campaign.id,
    );

    if (fresh) {
      setDetails(current => ({
        ...current,
        campaign: fresh,
      }));
    }
  }, [campaigns, details?.campaign?.id]);

  async function handleStatus(campaign, status) {
    setActionId(campaign.id);
    setError(null);

    try {
      await updateCampaignStatus(campaign.id, status);
      await loadCampaigns(true);
    } catch (requestError) {
      setError(requestError.message || 'Не удалось изменить статус');
    } finally {
      setActionId(null);
    }
  }

  async function handleStart(campaign) {
    setActionId(campaign.id);
    setError(null);

    try {
      await startCampaignScan(campaign.id);
      await loadCampaigns(true);
    } catch (requestError) {
      setError(requestError.message || 'Не удалось запустить проверку');
    } finally {
      setActionId(null);
    }
  }

  async function handlePause(campaign) {
    setActionId(campaign.id);
    setError(null);

    try {
      await pauseCampaignScan(campaign.id);
      await loadCampaigns(true);
    } catch (requestError) {
      setError(
        requestError.message || 'Не удалось поставить проверку на паузу',
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleRetryErrors(campaign) {
    setActionId(campaign.id);
    setError(null);

    try {
      await retryCampaignScanErrors(campaign.id);
      await loadCampaigns(true);
    } catch (requestError) {
      setError(requestError.message || 'Не удалось повторить ошибки');
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(campaign) {
    if (campaign.status === 'running') {
      setError(
        'Сначала поставьте сканирование на паузу, затем удаляйте кампанию.',
      );
      return;
    }

    if (!window.confirm(`Удалить кампанию «${campaign.name}»?`)) {
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
    } catch (requestError) {
      setError(requestError.message || 'Не удалось удалить кампанию');
    } finally {
      setActionId(null);
    }
  }

  async function openDetails(campaign) {
    setDetailsPage(1);
    setDetailsLoading(true);
    setError(null);

    try {
      const result = await getCampaignCompanies(campaign.id, {
        page: 1,
        limit: DETAILS_PAGE_SIZE,
      });

      setDetails({
        campaign,
        ...result,
      });
    } catch (requestError) {
      setError(
        requestError.message || 'Не удалось открыть компании кампании',
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setDetails(null);
  }

  async function changeDetailsPage(nextPage) {
    if (!details?.campaign?.id) {
      return;
    }

    setDetailsPage(nextPage);
    await loadDetails(details.campaign.id, nextPage);
  }

  async function openScanResult(company) {
    if (!details?.campaign?.id) {
      return;
    }

    setScanResultLoading(true);
    setError(null);

    try {
      const result = await getCampaignCompanyScanResult(
        details.campaign.id,
        company.id,
      );

      setScanResult(result);
    } catch (requestError) {
      setError(
        requestError.message || 'Не удалось открыть результат сканирования',
      );
    } finally {
      setScanResultLoading(false);
    }
  }

  function closeScanResult() {
    setScanResult(null);
  }

  const totalCompanies = useMemo(
    () =>
      campaigns.reduce(
        (sum, campaign) => sum + Number(campaign.companyCount || 0),
        0,
      ),
    [campaigns],
  );

  const runningCount = useMemo(
    () => campaigns.filter(campaign => campaign.status === 'running').length,
    [campaigns],
  );

  return {
    campaigns,
    loading,
    error,
    actionId,
    details,
    detailsLoading,
    scanResult,
    scanResultLoading,
    totalCompanies,
    runningCount,
    handleStatus,
    handleStart,
    handlePause,
    handleRetryErrors,
    handleDelete,
    openDetails,
    closeDetails,
    changeDetailsPage,
    openScanResult,
    closeScanResult,
  };
}
