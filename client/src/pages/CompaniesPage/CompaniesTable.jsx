import {
  ActionsCell,
  CheckboxCell,
  CompaniesCard,
  CompaniesTable as CompaniesTableRoot,
  CompanyName,
  CompanyWebsite,
  DeleteButton,
  EmptyCompanies,
  LoadingMessage,
  OpenWebsiteLink,
  PageButton,
  Pagination,
  PaginationControls,
  PaginationDots,
  PaginationInfo,
  RowActionButton,
  RowCheckbox,
  StatusBadge,
  TableWrapper,
} from './CompaniesPage.styles';
import { STATUS_LABELS } from './useCompaniesPage';

function getVisiblePages(pagination) {
  if (!pagination) return [];

  const current = pagination.page;
  const last = pagination.lastPage;

  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const pages = [1];

  if (current > 4) {
    pages.push('left-dots');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  for (let number = start; number <= end; number += 1) {
    pages.push(number);
  }

  if (current < last - 3) {
    pages.push('right-dots');
  }

  pages.push(last);
  return pages;
}

export function CompaniesTable({
  companies,
  currentPageAllSelected,
  deletingId,
  isCompanySelected,
  loading,
  onDelete,
  onEdit,
  onPageChange,
  onToggleCompany,
  onToggleCurrentPage,
  pagination,
}) {
  const visiblePages = getVisiblePages(pagination);

  return (
    <>
      <CompaniesCard>
        {loading ? (
          <LoadingMessage>Загружаем компании...</LoadingMessage>
        ) : !companies.length ? (
          <EmptyCompanies>
            <strong>Компании не найдены</strong>
            <span>Измените фильтры или добавьте компанию.</span>
          </EmptyCompanies>
        ) : (
          <TableWrapper>
            <CompaniesTableRoot>
              <thead>
                <tr>
                  <CheckboxCell as="th">
                    <RowCheckbox
                      type="checkbox"
                      checked={currentPageAllSelected}
                      onChange={onToggleCurrentPage}
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
                {companies.map(company => (
                  <tr key={company.id}>
                    <CheckboxCell>
                      <RowCheckbox
                        type="checkbox"
                        checked={isCompanySelected(company.id)}
                        onChange={() => onToggleCompany(company.id)}
                        aria-label={`Выбрать ${company.name}`}
                      />
                    </CheckboxCell>

                    <td>
                      <CompanyName title={company.name}>{company.name}</CompanyName>

                      {company.website && (
                        <CompanyWebsite href={company.website} target="_blank" rel="noreferrer">
                          {company.domain}
                          <span>↗</span>
                        </CompanyWebsite>
                      )}
                    </td>

                    <td>{company.city || '—'}</td>
                    <td title={company.category || ''}>{company.category || '—'}</td>
                    <td>{company.phone || '—'}</td>

                    <td>
                      <StatusBadge $status={company.scanStatus}>
                        {STATUS_LABELS[company.scanStatus] || company.scanStatus}
                      </StatusBadge>
                    </td>

                    <td>
                      <ActionsCell>
                        {company.website && (
                          <OpenWebsiteLink href={company.website} target="_blank" rel="noreferrer">
                            Открыть
                          </OpenWebsiteLink>
                        )}

                        <RowActionButton type="button" onClick={() => onEdit(company)}>
                          Изменить
                        </RowActionButton>

                        <DeleteButton
                          type="button"
                          disabled={deletingId === company.id}
                          onClick={() => onDelete(company)}
                        >
                          {deletingId === company.id ? 'Удаление...' : 'Удалить'}
                        </DeleteButton>
                      </ActionsCell>
                    </td>
                  </tr>
                ))}
              </tbody>
            </CompaniesTableRoot>
          </TableWrapper>
        )}
      </CompaniesCard>

      {pagination && pagination.total > 0 && (
        <Pagination>
          <PaginationInfo>
            Показано{' '}
            <strong>{(pagination.page - 1) * pagination.limit + 1}</strong>
            {' — '}
            <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong>
            {' из '}
            <strong>{pagination.total.toLocaleString('ru-RU')}</strong>
          </PaginationInfo>

          <PaginationControls>
            <PageButton
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(Math.max(pagination.page - 1, 1))}
            >
              ←
            </PageButton>

            {visiblePages.map(item => {
              if (typeof item !== 'number') {
                return <PaginationDots key={item}>…</PaginationDots>;
              }

              return (
                <PageButton
                  key={item}
                  type="button"
                  $active={item === pagination.page}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </PageButton>
              );
            })}

            <PageButton
              type="button"
              disabled={pagination.page >= pagination.lastPage}
              onClick={() => onPageChange(Math.min(pagination.page + 1, pagination.lastPage))}
            >
              →
            </PageButton>
          </PaginationControls>
        </Pagination>
      )}
    </>
  );
}
