import { Content } from '../../App.styles';
import { Header } from '../../components/Header/Header';

import { CampaignCard } from './CampaignCard';
import {
  CampaignDetailsModal,
  CampaignScanResultModal,
} from './CampaignModals';
import {
  formatCampaignNumber,
  useCampaigns,
} from './useCampaigns';

import {
  CampaignGrid,
  EmptyState,
  ErrorBox,
  HeaderRow,
  LoadingBox,
  ScanHint,
  Stat,
  Stats,
} from './CampaignsPage.styles';

export function CampaignsPage() {
  const {
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
  } = useCampaigns();

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
              <strong>{formatCampaignNumber(campaigns.length)}</strong>
              <span>кампаний</span>
            </Stat>

            <Stat>
              <strong>{formatCampaignNumber(totalCompanies)}</strong>
              <span>компаний в выборках</span>
            </Stat>

            <Stat>
              <strong>{formatCampaignNumber(runningCount)}</strong>
              <span>сканируются сейчас</span>
            </Stat>
          </Stats>
        </HeaderRow>

        <ScanHint>
          LeadBot проверяет максимум 2 сайта одновременно. Формы не отправляются и CAPTCHA
          автоматически не обходится.
        </ScanHint>

        {error && <ErrorBox>{error}</ErrorBox>}

        {loading ? (
          <LoadingBox>Загружаем кампании...</LoadingBox>
        ) : campaigns.length === 0 ? (
          <EmptyState>
            <strong>Кампаний пока нет</strong>
            <span>
              Перейдите в «База компаний», отметьте нужные компании и создайте кампанию.
            </span>
          </EmptyState>
        ) : (
          <CampaignGrid>
            {campaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                busy={actionId === campaign.id}
                detailsLoading={detailsLoading}
                onOpenDetails={openDetails}
                onStatus={handleStatus}
                onStart={handleStart}
                onPause={handlePause}
                onRetryErrors={handleRetryErrors}
                onDelete={handleDelete}
              />
            ))}
          </CampaignGrid>
        )}
      </Content>

      <CampaignDetailsModal
        details={details}
        detailsLoading={detailsLoading}
        scanResultLoading={scanResultLoading}
        onClose={closeDetails}
        onChangePage={changeDetailsPage}
        onOpenScanResult={openScanResult}
      />

      <CampaignScanResultModal
        scanResult={scanResult}
        onClose={closeScanResult}
      />
    </>
  );
}
