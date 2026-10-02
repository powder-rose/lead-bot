import {
    EmptyState,
    EmptyIcon,
    ResultSection,
    ResultHeader,
    SiteIdentity,
    SiteAvatar,
    SiteInfo,
    SiteUrl,
    ScanStatus,
    StatsGrid,
    StatCard,
    StatLabel,
    StatValue,
    StatHint,
    EmptyFormState,
} from "./ScanResults.styles.js";

import {
    getDomain,
    getFieldType,
} from "../../utils/formUtils.js";

import {
    FormCard,
} from "./FormCard.jsx";

export const ScanResults = ({
    result,
    loading,
    fillMode,
    leadData,
    testingForm,
    testResult,
    testError,
    onTestFill,
}) => {
    if (!result && !loading) {
        return (
            <EmptyState>
                <EmptyIcon>
                    ⌁
                </EmptyIcon>

                <div>
                    <strong>
                        Результатов пока нет
                    </strong>

                    <span>
                        Введите адрес сайта выше.
                    </span>
                </div>
            </EmptyState>
        );
    }

    if (!result) {
        return null;
    }

    const fieldsCount =
        result.forms?.reduce(
            (sum, form) =>
                sum +
                (form.fields?.length || 0),
            0
        ) || 0;

    const recognizedCount =
        result.forms?.reduce(
            (sum, form) => {
                const count =
                    (form.fields || []).filter(
                        (field) =>
                            getFieldType(field).type !==
                            "unknown"
                    ).length;

                return sum + count;
            },
            0
        ) || 0;

    return (
        <ResultSection>
            <ResultHeader>
                <SiteIdentity>
                    <SiteAvatar>
                        {getDomain(result.url)
                            .charAt(0)
                            .toUpperCase()}
                    </SiteAvatar>

                    <SiteInfo>
                        <span>
                            Результат анализа
                        </span>

                        <strong>
                            {result.title ||
                                getDomain(result.url)}
                        </strong>

                        <SiteUrl
                            href={result.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {getDomain(result.url)}
                            <span>
                                ↗
                            </span>
                        </SiteUrl>
                    </SiteInfo>
                </SiteIdentity>

                <ScanStatus>
                    <i />
                    Анализ завершён
                </ScanStatus>
            </ResultHeader>

            <StatsGrid>
                <StatCard>
                    <StatLabel>
                        Подходящих форм
                    </StatLabel>

                    <StatValue>
                        {result.formsCount || 0}
                    </StatValue>

                    <StatHint>
                        Проверено страниц:{" "}
                        {result.scannedPages?.length ||
                            1}
                    </StatHint>
                </StatCard>

                <StatCard>
                    <StatLabel>
                        Полей
                    </StatLabel>

                    <StatValue>
                        {fieldsCount}
                    </StatValue>

                    <StatHint>
                        Только полезные поля
                    </StatHint>
                </StatCard>

                <StatCard>
                    <StatLabel>
                        Распознано
                    </StatLabel>

                    <StatValue>
                        {recognizedCount}
                    </StatValue>

                    <StatHint>
                        Имя, телефон, email и сообщение
                    </StatHint>
                </StatCard>

                <StatCard>
                    <StatLabel>
                        Лучший рейтинг
                    </StatLabel>

                    <StatValue>
                        {result.forms?.[0]?.score ||
                            0}
                        %
                    </StatValue>

                    <StatHint>
                        Автоматическая оценка
                    </StatHint>
                </StatCard>
            </StatsGrid>

            {!result.forms?.length ? (
                <EmptyFormState>
                    <strong>
                        Подходящих форм не найдено
                    </strong>

                    <span>
                        Сайт проанализирован,
                        но LeadBot не нашёл
                        подходящую форму заявки.
                    </span>
                </EmptyFormState>
            ) : (
                result.forms.map(
                    (form) => (
                        <FormCard
                            key={form.formIndex}
                            form={form}
                            testingForm={
                                testingForm
                            }
                            testResult={
                                testResult
                            }
                            leadData={
                                leadData
                            }
                            testError={
                                testError
                            }
                            onTestFill={
                                onTestFill
                            }
                            fillMode={
                                fillMode
                            }
                        />
                    )
                )
            )}
        </ResultSection>
    );
};
