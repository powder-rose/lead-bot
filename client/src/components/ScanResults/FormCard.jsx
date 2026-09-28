import {
    FormCard as FormCardContainer,
    FormCardHeader,
    FormNumber,
    FormTitle,
    FormStatus,
    MetaRow,
    MetaChip,
    FieldsGrid,
    FieldCard,
    FieldTop,
    FieldTypeBadge,
    RequiredBadge,
    FieldDetails,
    Detail,
    DetailLabel,
    DetailValue,
    ButtonsSection,
    SubmitPreview,
    TestFillButton,
    TestResultCard,
    TestResultHeader,
    TestScreenshot,
    TestError,
    FormScore,
    RecommendedBadge,
    ScoreReasons,
} from "./FormCard.styles.js";


import {
    SiteUrl,
} from "./ScanResults.styles.js";

import {
    getFieldType,
} from "../../utils/formUtils.js";

export const FormCard = ({
    form,
    testingForm,
    testResult,
    testError,
    onTestFill,
}) => {
    const isCurrentTest =
        testResult?.formIndex ===
        form.formIndex;

    return (
        <FormCardContainer>
            <FormCardHeader>
                <div>
                    <FormNumber>
                        {form.recommended
                            ? "РЕКОМЕНДУЕМАЯ ФОРМА"
                            : `FORM ${String(
                                  form.formIndex + 1
                              ).padStart(2, "0")}`}
                    </FormNumber>

                    <FormTitle>
                        Форма обратной связи
                    </FormTitle>

                    <SiteUrl
                        href={form.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {form.pageUrl}
                        <span>
                            ↗
                        </span>
                    </SiteUrl>

                    <MetaRow>
                        <MetaChip>
                            {form.fields.length} полей
                        </MetaChip>

                        <MetaChip>
                            {form.source === "popup"
                                ? "POPUP"
                                : "PAGE"}
                        </MetaChip>

                        <MetaChip>
                            {form.method?.toUpperCase() ||
                                "—"}
                        </MetaChip>
                    </MetaRow>

                    <FormScore>
                        <strong>
                            {form.score || 0}%
                        </strong>

                        <span>
                            качество формы
                        </span>
                    </FormScore>

                    {form.scoreReasons?.length > 0 && (
                        <ScoreReasons>
                            {form.scoreReasons.map(
                                (reason) => (
                                    <span key={reason}>
                                        {reason}
                                    </span>
                                )
                            )}
                        </ScoreReasons>
                    )}
                </div>

                {form.recommended ? (
                    <RecommendedBadge>
                        <i />
                        Лучший вариант
                    </RecommendedBadge>
                ) : (
                    <FormStatus $type="neutral">
                        <i />
                        Найдена
                    </FormStatus>
                )}
            </FormCardHeader>

            <FieldsGrid>
                {form.fields.map(
                    (field, index) => {
                        const type =
                            getFieldType(field);

                        return (
                            <FieldCard
                                key={`${form.formIndex}-${index}`}
                            >
                                <FieldTop>
                                    <FieldTypeBadge
                                        $type={type.type}
                                    >
                                        {type.label}
                                    </FieldTypeBadge>

                                    {field.required && (
                                        <RequiredBadge>
                                            обязательно
                                        </RequiredBadge>
                                    )}
                                </FieldTop>

                                <FieldDetails>
                                    <Detail>
                                        <DetailLabel>
                                            name
                                        </DetailLabel>

                                        <DetailValue>
                                            {field.name ||
                                                "—"}
                                        </DetailValue>
                                    </Detail>

                                    <Detail>
                                        <DetailLabel>
                                            type
                                        </DetailLabel>

                                        <DetailValue>
                                            {field.type ||
                                                "—"}
                                        </DetailValue>
                                    </Detail>

                                    <Detail>
                                        <DetailLabel>
                                            placeholder
                                        </DetailLabel>

                                        <DetailValue>
                                            {field.placeholder ||
                                                "—"}
                                        </DetailValue>
                                    </Detail>

                                    <Detail>
                                        <DetailLabel>
                                            label
                                        </DetailLabel>

                                        <DetailValue>
                                            {field.label ||
                                                "—"}
                                        </DetailValue>
                                    </Detail>
                                </FieldDetails>
                            </FieldCard>
                        );
                    }
                )}
            </FieldsGrid>

            {form.buttons?.length > 0 && (
                <ButtonsSection>
                    <span>
                        Кнопки формы
                    </span>

                    {form.buttons.map(
                        (button, index) => (
                            <SubmitPreview
                                key={`${form.formIndex}-button-${index}`}
                                disabled
                            >
                                <span>
                                    {button.text ||
                                        "Без текста"}
                                </span>

                                <small>
                                    {button.type ||
                                        "button"}
                                </small>
                            </SubmitPreview>
                        )
                    )}
                </ButtonsSection>
            )}

            <TestFillButton
                type="button"
                onClick={() =>
                    onTestFill(form)
                }
                disabled={
                    testingForm ===
                    form.formIndex
                }
            >
                {testingForm ===
                form.formIndex
                    ? "Заполняем..."
                    : "Тестовое заполнение"}

                <span>
                    →
                </span>
            </TestFillButton>

            {isCurrentTest && (
                <TestResultCard>
                    <TestResultHeader>
                        <div>
                            <strong>
                                Тест завершён
                            </strong>

                            <span>
                                Заполнено полей:{" "}
                                {testResult.filledCount}
                            </span>
                        </div>

                        <span>
                            Не отправлено
                        </span>
                    </TestResultHeader>

                    {testResult.screenshot && (
                        <TestScreenshot
                            src={testResult.screenshot}
                            alt="Тестовое заполнение"
                        />
                    )}
                </TestResultCard>
            )}

            {testError &&
                isCurrentTest && (
                    <TestError>
                        {testError}
                    </TestError>
                )}
        </FormCardContainer>
    );
};
