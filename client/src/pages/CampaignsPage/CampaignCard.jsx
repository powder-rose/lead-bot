import {
  ActionButton,
  CampaignActions,
  CampaignCard as CampaignCardContainer,
  CampaignMeta,
  CampaignName,
  CampaignText,
  DeleteButton,
  ProgressBar,
  ProgressFill,
  ProgressMeta,
  SecondaryButton,
  Stat,
  Stats,
  StatusBadge,
} from './CampaignsPage.styles';

import {
  formatCampaignDate,
  formatCampaignNumber,
  getCampaignProgress,
  getProcessedCount,
  STATUS_LABELS,
} from './useCampaigns';

export function CampaignCard({
  campaign,
  busy,
  detailsLoading,
  onOpenDetails,
  onStatus,
  onStart,
  onPause,
  onRetryErrors,
  onDelete,
}) {
  const progress = getCampaignProgress(campaign);

  return (
    <CampaignCardContainer>
      <CampaignMeta>
        <StatusBadge $status={campaign.status}>
          {STATUS_LABELS[campaign.status] || campaign.status}
        </StatusBadge>

        <span>{formatCampaignDate(campaign.createdAt)}</span>
      </CampaignMeta>

      <CampaignName>{campaign.name}</CampaignName>

      <CampaignText title={campaign.message}>
        {campaign.message}
      </CampaignText>

      <ProgressMeta>
        <span>
          Проверено {formatCampaignNumber(getProcessedCount(campaign))} из{' '}
          {formatCampaignNumber(campaign.companyCount)}
        </span>

        <strong>{progress}%</strong>
      </ProgressMeta>

      <ProgressBar>
        <ProgressFill $value={progress} />
      </ProgressBar>

      <Stats>
        <Stat>
          <strong>{formatCampaignNumber(campaign.formFoundCount)}</strong>
          <span>форм найдено</span>
        </Stat>

        <Stat>
          <strong>{formatCampaignNumber(campaign.noFormCount)}</strong>
          <span>без формы</span>
        </Stat>

        <Stat>
          <strong>{formatCampaignNumber(campaign.errorCount)}</strong>
          <span>ошибок</span>
        </Stat>

        <Stat>
          <strong>{formatCampaignNumber(campaign.captchaCount)}</strong>
          <span>с CAPTCHA</span>
        </Stat>
      </Stats>

      <CampaignActions>
        <ActionButton
          type="button"
          onClick={() => onOpenDetails(campaign)}
          disabled={detailsLoading}
        >
          Компании
        </ActionButton>

        {campaign.status === 'draft' && (
          <ActionButton
            type="button"
            onClick={() => onStatus(campaign, 'ready')}
            disabled={busy}
          >
            Готова к проверке
          </ActionButton>
        )}

        {campaign.status === 'running' ? (
          <ActionButton
            type="button"
            onClick={() => onPause(campaign)}
            disabled={busy}
          >
            {busy ? 'Ставим на паузу...' : 'Пауза'}
          </ActionButton>
        ) : (
          campaign.pendingCount > 0 &&
          campaign.status !== 'draft' && (
            <ActionButton
              type="button"
              onClick={() => onStart(campaign)}
              disabled={busy}
            >
              {busy
                ? 'Запускаем...'
                : campaign.status === 'paused'
                  ? 'Продолжить проверку'
                  : 'Запустить проверку'}
            </ActionButton>
          )
        )}

        {campaign.errorCount > 0 && campaign.status !== 'running' && (
          <SecondaryButton
            type="button"
            onClick={() => onRetryErrors(campaign)}
            disabled={busy}
          >
            Повторить ошибки ({formatCampaignNumber(campaign.errorCount)})
          </SecondaryButton>
        )}

        <DeleteButton
          type="button"
          onClick={() => onDelete(campaign)}
          disabled={busy || campaign.status === 'running'}
        >
          Удалить
        </DeleteButton>
      </CampaignActions>
    </CampaignCardContainer>
  );
}
