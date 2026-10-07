import {
  RubricCheckbox,
  RubricCount,
  RubricItem,
  RubricList,
  RubricsColumns,
  RubricsHeader,
  RubricsSearch,
  RubricsSection,
  SelectedInfo,
} from './CompaniesImport.styles';
import { formatImportNumber } from './useCompaniesImport';

export function CompaniesImportRubrics({
  rubrics,
  rubricSearch,
  selectedCategories,
  selectedSubcategories,
  visibleCategories,
  visibleSubcategories,
  selectedCount,
  onSearchChange,
  onToggleCategory,
  onToggleSubcategory,
}) {
  return (
    <>
      <RubricsHeader>
        <div>
          <strong>
            Найдено: {formatImportNumber(rubrics.totals?.categories)} рубрик и{' '}
            {formatImportNumber(rubrics.totals?.subcategories)} подрубрик
          </strong>

          <SelectedInfo>
            Выбрано: {selectedCount}. Выбор сохраняется автоматически.
          </SelectedInfo>
        </div>

        <RubricsSearch
          value={rubricSearch}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Например: пожарная безопасность"
        />
      </RubricsHeader>

      <RubricsColumns>
        <RubricsSection>
          <h3>Рубрики</h3>

          <RubricList>
            {visibleCategories.map((item) => (
              <RubricItem key={item.name}>
                <RubricCheckbox
                  type="checkbox"
                  checked={selectedCategories.includes(item.name)}
                  onChange={() => onToggleCategory(item.name)}
                />
                <span>{item.name}</span>
                <RubricCount>{formatImportNumber(item.count)}</RubricCount>
              </RubricItem>
            ))}
          </RubricList>
        </RubricsSection>

        <RubricsSection>
          <h3>Подрубрики</h3>

          <RubricList>
            {visibleSubcategories.map((item) => (
              <RubricItem key={item.name}>
                <RubricCheckbox
                  type="checkbox"
                  checked={selectedSubcategories.includes(item.name)}
                  onChange={() => onToggleSubcategory(item.name)}
                />
                <span>{item.name}</span>
                <RubricCount>{formatImportNumber(item.count)}</RubricCount>
              </RubricItem>
            ))}
          </RubricList>
        </RubricsSection>
      </RubricsColumns>
    </>
  );
}
