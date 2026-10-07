import {
  ImportSubtitle,
  PreviewTable,
  PreviewTableWrapper,
  SelectedInfo,
  StatCard,
  StatLabel,
  StatsGrid,
  StatValue,
} from './CompaniesImport.styles';
import { formatImportNumber } from './useCompaniesImport';

const Stat = ({ value, label }) => (
  <StatCard>
    <StatValue>{formatImportNumber(value)}</StatValue>
    <StatLabel>{label}</StatLabel>
  </StatCard>
);

export function ImportPreviewStep({ preview }) {
  return (
    <>
      <StatsGrid>
        <Stat value={preview.estimatedCompanyRows} label="строк в файле" />

        <StatCard>
          <StatValue>{preview.headerRow}</StatValue>
          <StatLabel>строка заголовков</StatLabel>
        </StatCard>

        <Stat
          value={preview.previewStats?.withWebsite}
          label="с сайтом в preview"
        />
        <Stat
          value={preview.previewStats?.withoutWebsite}
          label="без сайта в preview"
        />
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
            {preview.preview?.slice(0, 15).map((company) => (
              <tr key={company.rowNumber}>
                <td>
                  <strong>{company.name}</strong>
                </td>
                <td>{company.domain || '—'}</td>
                <td>{company.city || '—'}</td>
                <td>{company.category || '—'}</td>
              </tr>
            ))}
          </tbody>
        </PreviewTable>
      </PreviewTableWrapper>
    </>
  );
}

export function ImportResultStep({ importResult }) {
  return (
    <>
      <StatsGrid>
        <Stat value={importResult.imported} label="компаний импортировано" />
        <Stat
          value={importResult.skippedExisting}
          label="пропущено: уже были в LeadBot"
        />
        <Stat
          value={importResult.duplicateRows}
          label="дублей объединено по домену"
        />
        <Stat
          value={importResult.totalCompanies}
          label="всего компаний теперь в базе"
        />
      </StatsGrid>

      <SelectedInfo>
        Импорт завершён успешно. Новые компании получили статус «Новая».
      </SelectedInfo>
    </>
  );
}

export function SelectionAnalysisStep({ selectionAnalysis, selectedCount }) {
  return (
    <>
      <StatsGrid>
        <Stat
          value={selectionAnalysis.matchedRows}
          label="строк соответствуют выбранным рубрикам"
        />
        <Stat
          value={selectionAnalysis.validWebsiteRows}
          label="строк с пригодным сайтом"
        />
        <Stat value={selectionAnalysis.withoutWebsite} label="без сайта" />
        <Stat
          value={selectionAnalysis.excludedWebsiteRows}
          label="исключено сервисов и нецелевых доменов"
        />
        <Stat
          value={selectionAnalysis.invalidWebsiteRows}
          label="некорректных сайтов"
        />
        <Stat
          value={selectionAnalysis.uniqueDomains}
          label="уникальных пригодных доменов"
        />
        <Stat
          value={selectionAnalysis.duplicateRows}
          label="дублей по домену"
        />
        <Stat
          value={selectionAnalysis.existingDomains}
          label="уже есть в LeadBot"
        />
        <Stat
          value={selectionAnalysis.readyToImport}
          label="реально готово к импорту"
        />
      </StatsGrid>

      <SelectedInfo>
        Выбрано рубрик и подрубрик: {selectedCount}
      </SelectedInfo>

      {selectionAnalysis.topExcludedDomains?.length > 0 && (
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
                {selectionAnalysis.topExcludedDomains.map((item) => (
                  <tr key={item.domain}>
                    <td>
                      <strong>{item.domain}</strong>
                    </td>
                    <td>{formatImportNumber(item.count)}</td>
                  </tr>
                ))}
              </tbody>
            </PreviewTable>
          </PreviewTableWrapper>
        </>
      )}
    </>
  );
}

export function ImportAnalysisStep({ analysis }) {
  return (
    <StatsGrid>
      <Stat value={analysis.totalRows} label="всего компаний" />
      <Stat
        value={analysis.validWebsiteRows}
        label="строк с рабочим адресом сайта"
      />
      <Stat
        value={analysis.withoutWebsite}
        label="действительно без сайта"
      />
      <Stat value={analysis.invalidWebsiteRows} label="некорректный сайт" />
      <Stat
        value={analysis.excludedWebsiteRows}
        label="исключено: мессенджеры, сервисы и госдомены"
      />
      <Stat value={analysis.uniqueDomains} label="уникальных доменов" />
      <Stat value={analysis.duplicateRows} label="дублей по домену" />
      <Stat value={analysis.existingDomains} label="уже есть в LeadBot" />
      <Stat
        value={analysis.readyToImport}
        label="пригодных уникальных доменов"
      />
    </StatsGrid>
  );
}
