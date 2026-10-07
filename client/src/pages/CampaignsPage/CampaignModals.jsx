import {
  ActionButton,
  CaptchaBadge,
  CompanyActions,
  CompanyLine,
  CompanyList,
  CompanyMeta,
  EmptyState,
  ErrorBox,
  FormBlock,
  FormFieldList,
  Modal,
  ModalClose,
  ModalOverlay,
  ModalTitle,
  PaginationActions,
  ResultLink,
  ResultModal,
  ResultSection,
  ScanHint,
  Stat,
  Stats,
  StatusBadge,
} from './CampaignsPage.styles';

import {
  formatCampaignNumber,
  PROCESSING_LABELS,
} from './useCampaigns';

export function CampaignDetailsModal({
  details,
  detailsLoading,
  scanResultLoading,
  onClose,
  onChangePage,
  onOpenScanResult,
}) {
  if (!details) {
    return null;
  }

  return (
    <ModalOverlay
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Modal>
        <ModalTitle>
          <div>
            <strong>{details.campaign.name}</strong>

            <span>
              Страница {details.pagination.page} из {details.pagination.lastPage}. Всего{' '}
              {formatCampaignNumber(details.pagination.total)} компаний.
            </span>
          </div>

          <ModalClose
            type="button"
            onClick={onClose}
          >
            ×
          </ModalClose>
        </ModalTitle>

        <CompanyList>
          {details.companies.map(company => (
            <CompanyLine key={company.id}>
              <div>
                <strong>{company.companyName}</strong>

                <CompanyMeta>
                  <span>{company.domain || company.website || 'Нет сайта'}</span>

                  {company.scanFormsCount > 0 && (
                    <span>Форм: {company.scanFormsCount}</span>
                  )}

                  {company.bestFormScore > 0 && (
                    <span>Лучший рейтинг: {company.bestFormScore}%</span>
                  )}
                </CompanyMeta>

                {company.scanError && (
                  <ErrorBox title={company.scanError}>
                    {company.scanError}
                  </ErrorBox>
                )}
              </div>

              <CompanyActions>
                {company.hasCaptcha && <CaptchaBadge>CAPTCHA</CaptchaBadge>}

                <StatusBadge $status={company.processingStatus}>
                  {PROCESSING_LABELS[company.processingStatus] || company.processingStatus}
                </StatusBadge>

                {[
                  'form_found',
                  'no_form',
                  'error',
                  'test_filled',
                ].includes(company.processingStatus) && (
                  <ActionButton
                    type="button"
                    onClick={() => onOpenScanResult(company)}
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
              disabled={detailsLoading || details.pagination.page <= 1}
              onClick={() => onChangePage(details.pagination.page - 1)}
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
                details.pagination.page >= details.pagination.lastPage
              }
              onClick={() => onChangePage(details.pagination.page + 1)}
            >
              Далее →
            </ActionButton>
          </PaginationActions>
        )}
      </Modal>
    </ModalOverlay>
  );
}

export function CampaignScanResultModal({
  scanResult,
  onClose,
}) {
  if (!scanResult) {
    return null;
  }

  return (
    <ModalOverlay
      $higher
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <ResultModal>
        <ModalTitle>
          <div>
            <strong>{scanResult.companyName}</strong>
            <span>{scanResult.domain || scanResult.website}</span>
          </div>

          <ModalClose
            type="button"
            onClick={onClose}
          >
            ×
          </ModalClose>
        </ModalTitle>

        <ResultSection>
          <Stats>
            <Stat>
              <strong>{scanResult.scanFormsCount}</strong>
              <span>форм найдено</span>
            </Stat>

            <Stat>
              <strong>{scanResult.bestFormScore}%</strong>
              <span>лучший рейтинг</span>
            </Stat>

            <Stat>
              <strong>{scanResult.hasCaptcha ? 'Да' : 'Нет'}</strong>
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

          {scanResult.scanError && <ErrorBox>{scanResult.scanError}</ErrorBox>}

          {scanResult.hasCaptcha && (
            <ScanHint>
              На странице обнаружены признаки CAPTCHA. LeadBot не пытается обходить её
              автоматически.
            </ScanHint>
          )}

          {scanResult.forms?.length > 0 ? (
            scanResult.forms.map((form, index) => (
              <FormBlock key={`${form.pageUrl}-${index}`}>
                <div>
                  <strong>Форма {index + 1}</strong>

                  <span>
                    {form.source === 'popup' ? 'POPUP' : 'PAGE'} · рейтинг {form.score || 0}%
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
                      {field.label || field.placeholder || field.name || field.type || 'Поле'}
                      {field.required ? ' *' : ''}
                    </span>
                  ))}
                </FormFieldList>
              </FormBlock>
            ))
          ) : (
            <EmptyState>
              <strong>Формы не найдены</strong>
              <span>
                Сайт был проверен, но подходящей формы обратной связи LeadBot не обнаружил.
              </span>
            </EmptyState>
          )}
        </ResultSection>
      </ResultModal>
    </ModalOverlay>
  );
}
