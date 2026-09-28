import {
    HeroCard,
    HeroGlow,
    HeroHeader,
    HeroKicker,
    HeroTitle,
    HeroText,
    ScanForm,
    UrlField,
    UrlPrefix,
    UrlInput,
    ScanButton,
    Spinner,
    ErrorBox,
} from "./Scanner.styles.js";

export const Scanner = ({
    url,
    loading,
    error,
    onUrlChange,
    onSubmit,
}) => {
    return (
        <HeroCard>
            <HeroGlow />

            <HeroHeader>
                <HeroKicker>
                    НОВЫЙ АНАЛИЗ
                </HeroKicker>

                <HeroTitle>
                    Проверим сайт компании
                </HeroTitle>

                <HeroText>
                    LeadBot найдёт обычные и
                    всплывающие формы,
                    определит поля и позволит
                    безопасно проверить
                    заполнение.
                </HeroText>
            </HeroHeader>

            <ScanForm onSubmit={onSubmit}>
                <UrlField>
                    <UrlPrefix>
                        https://
                    </UrlPrefix>

                    <UrlInput
                        value={url}
                        onChange={(event) =>
                            onUrlChange(
                                event.target.value
                            )
                        }
                        placeholder="company.ru"
                        disabled={loading}
                    />
                </UrlField>

                <ScanButton
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner />
                            Анализируем
                        </>
                    ) : (
                        <>
                            Анализировать
                            <span>
                                →
                            </span>
                        </>
                    )}
                </ScanButton>
            </ScanForm>

            {error && (
                <ErrorBox>
                    <strong>
                        Ошибка анализа
                    </strong>

                    <span>
                        {error}
                    </span>
                </ErrorBox>
            )}
        </HeroCard>
    );
};
