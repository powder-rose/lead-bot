import {
    useMemo,
    useState,
} from "react";

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
    ActionRow,
    FormDataButton,
    FormDataPanel,
    FormDataTitle,
    FormDataGrid,
    FormDataField,
    ExtraFieldsTitle,
    ExtraFieldRow,
    ExtraInput,
    ExtraSelect,
    ExtraCheckbox,
} from "./FormCard.styles.js";


import {
    SiteUrl,
} from "./ScanResults.styles.js";

import {
    getFieldType,
} from "../../utils/formUtils.js";

export const FormCard = ({
    form,
    leadData,
    fillMode,
    testingForm,
    testResult,
    testError,
    onTestFill,
}) => {
    const isCurrentTest =
        testResult?.formIndex ===
        form.formIndex;

    const [
    formDataOpen,
    setFormDataOpen,
] =
    useState(false);


const additionalFields =
    useMemo(
        () =>
            (
                form.fields ||
                []
            )
                .map(
                    (
                        field,
                        index
                    ) => ({
                        field,
                        index,

                        detected:
                            getFieldType(
                                field
                            ),
                    })
                )
                .filter(
                    (
                        item
                    ) =>
                        ![
                            "name",
                            "phone",
                            "email",
                            "subject",
                            "message",
                        ].includes(
                            item.detected
                                .type
                        )
                ),
        [
            form.fields,
        ]
    );


const makeFieldKey = (
    field,
    index
) =>
    [
        field.id,
        field.name,
        field.type,
        field.value,
        index,
    ].join(
        "::"
    );


const [
    extraValues,
    setExtraValues,
] =
    useState({});


const setExtraValue = (
    key,
    value
) => {
    setExtraValues(
        (
            current
        ) => ({
            ...current,

            [key]:
                value,
        })
    );
};


const buildFieldValues =
    () => {
        return additionalFields
            .map(
                (
                    {
                        field,
                        index,
                    }
                ) => {
                    const key =
                        makeFieldKey(
                            field,
                            index
                        );

                    const type =
                        (
                            field.type ||
                            ""
                        ).toLowerCase();


                    if (
                        type ===
                        "checkbox"
                    ) {
                        return {
                            id:
                                field.id ||
                                "",

                            name:
                                field.name ||
                                "",

                            type,

                            checked:
                                Boolean(
                                    extraValues[
                                        key
                                    ]
                                ),
                        };
                    }


                    if (
                        type ===
                        "radio"
                    ) {
                        return {
                            id:
                                field.id ||
                                "",

                            name:
                                field.name ||
                                "",

                            type,

                            optionValue:
                                field.value ||
                                "",

                            checked:
                                extraValues[
                                    `radio:${
                                        field.name
                                    }`
                                ] ===
                                key,
                        };
                    }


                    return {
                        id:
                            field.id ||
                            "",

                        name:
                            field.name ||
                            "",

                        type,

                        value:
                            extraValues[
                                key
                            ] ??
                            "",
                    };
                }
            );
    };

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

            {formDataOpen && (
                <FormDataPanel>
                    <FormDataTitle>
                        Данные для этой заявки
                    </FormDataTitle>


                    <FormDataGrid>
                        <FormDataField>
                            <span>
                                Имя
                            </span>

                            <strong>
                                {leadData?.name ||
                                    "Не указано"}
                            </strong>
                        </FormDataField>

                        <FormDataField>
                            <span>
                                Телефон
                            </span>

                            <strong>
                                {leadData?.phone ||
                                    "Не указано"}
                            </strong>
                        </FormDataField>

                        <FormDataField>
                            <span>
                                Email
                            </span>

                            <strong>
                                {leadData?.email ||
                                    "Не указано"}
                            </strong>
                        </FormDataField>

                        <FormDataField>
                            <span>
                                Тема письма
                            </span>

                            <strong>
                                {leadData?.subject ||
                                    "Не указано"}
                            </strong>
                        </FormDataField>

                        <FormDataField>
                            <span>
                                Комментарий
                            </span>

                            <strong>
                                {leadData?.message ||
                                    "Не указано"}
                            </strong>
                        </FormDataField>
                    </FormDataGrid>


                    {additionalFields.length >
                        0 && (
                            <>
                                <ExtraFieldsTitle>
                                    Дополнительные поля сайта
                                </ExtraFieldsTitle>


                                {additionalFields.map(
                                    (
                                        {
                                            field,
                                            index,
                                        }
                                    ) => {
                                        const key =
                                            makeFieldKey(
                                                field,
                                                index
                                            );

                                        const type =
                                            (
                                                field.type ||
                                                ""
                                            ).toLowerCase();

                                        const label =
                                            field.label ||
                                            field.placeholder ||
                                            field.name ||
                                            "Дополнительное поле";


                                        if (
                                            type ===
                                            "checkbox"
                                        ) {
                                            return (
                                                <ExtraCheckbox
                                                    key={
                                                        key
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            Boolean(
                                                                extraValues[
                                                                key
                                                                ]
                                                            )
                                                        }
                                                        onChange={
                                                            (
                                                                event
                                                            ) =>
                                                                setExtraValue(
                                                                    key,
                                                                    event
                                                                        .target
                                                                        .checked
                                                                )
                                                        }
                                                    />

                                                    <span>
                                                        {label}

                                                        {field.required
                                                            ? " *"
                                                            : ""}
                                                    </span>
                                                </ExtraCheckbox>
                                            );
                                        }


                                        if (
                                            type ===
                                            "radio"
                                        ) {
                                            return (
                                                <ExtraCheckbox
                                                    key={
                                                        key
                                                    }
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`form-${form.formIndex
                                                            }-${field.name
                                                            }`}
                                                        checked={
                                                            extraValues[
                                                            `radio:${field.name
                                                            }`
                                                            ] ===
                                                            key
                                                        }
                                                        onChange={() =>
                                                            setExtraValue(
                                                                `radio:${field.name
                                                                }`,
                                                                key
                                                            )
                                                        }
                                                    />

                                                    <span>
                                                        {label ||
                                                            field.value}
                                                    </span>
                                                </ExtraCheckbox>
                                            );
                                        }


                                        if (
                                            field.tag ===
                                            "select"
                                        ) {
                                            return (
                                                <ExtraFieldRow
                                                    key={
                                                        key
                                                    }
                                                >
                                                    <label>
                                                        {label}

                                                        {field.required
                                                            ? " *"
                                                            : ""}
                                                    </label>

                                                    <ExtraSelect
                                                        value={
                                                            extraValues[
                                                            key
                                                            ] ??
                                                            ""
                                                        }
                                                        onChange={
                                                            (
                                                                event
                                                            ) =>
                                                                setExtraValue(
                                                                    key,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                        }
                                                    >
                                                        <option value="">
                                                            Не выбрано
                                                        </option>

                                                        {(field.options ||
                                                            [])
                                                            .filter(
                                                                (
                                                                    option
                                                                ) =>
                                                                    !option
                                                                        .disabled
                                                            )
                                                            .map(
                                                                (
                                                                    option
                                                                ) => (
                                                                    <option
                                                                        key={`${key}-${option.value}`}
                                                                        value={
                                                                            option.value
                                                                        }
                                                                    >
                                                                        {option.label ||
                                                                            option.value}
                                                                    </option>
                                                                )
                                                            )}
                                                    </ExtraSelect>
                                                </ExtraFieldRow>
                                            );
                                        }


                                        return (
                                            <ExtraFieldRow
                                                key={
                                                    key
                                                }
                                            >
                                                <label>
                                                    {label}

                                                    {field.required
                                                        ? " *"
                                                        : ""}
                                                </label>

                                                <ExtraInput
                                                    value={
                                                        extraValues[
                                                        key
                                                        ] ??
                                                        ""
                                                    }
                                                    onChange={
                                                        (
                                                            event
                                                        ) =>
                                                            setExtraValue(
                                                                key,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                    }
                                                />
                                            </ExtraFieldRow>
                                        );
                                    }
                                )}
                            </>
                        )}
                </FormDataPanel>
            )}

            <ActionRow>
                <FormDataButton
                    type="button"
                    onClick={() =>
                        setFormDataOpen(
                            (
                                current
                            ) =>
                                !current
                        )
                    }
                >
                    Данные для заявки

                    <span>
                        {formDataOpen
                            ? "↑"
                            : "↓"}
                    </span>
                </FormDataButton>


                <TestFillButton
                    type="button"
                    onClick={() =>
                        onTestFill(
                            form,
                            fillMode ===
                                "manual"
                                ? buildFieldValues()
                                : []
                        )
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
            </ActionRow>

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
