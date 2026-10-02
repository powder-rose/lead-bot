import {
    LeadDataCard,
    LeadDataHeader,
    LeadFields,
    LeadField,
    LeadInput,
    LeadTextarea,
    FillModeSwitch,
    FillModeButton,
} from "./LeadData.styles.js";

export const LeadData = ({
    leadData,
    onChange,
    fillMode,
    onFillModeChange,
}) => {
    return (
        <LeadDataCard>
            <LeadDataHeader>
                <div>
                    <span>
                        ДАННЫЕ ДЛЯ ЗАЯВКИ
                    </span>

                    <h3>
                        Что будем подставлять
                    </h3>

                    <p>
                        Эти данные используются
                        только для тестового
                        заполнения. Форма
                        автоматически не
                        отправляется.
                    </p>
                </div>
                <FillModeSwitch>
                    <FillModeButton
                        type="button"
                        $active={
                            fillMode ===
                            "auto"
                        }
                        onClick={() =>
                            onFillModeChange(
                                "auto"
                            )
                        }
                    >
                        Автоматически
                    </FillModeButton>

                    <FillModeButton
                        type="button"
                        $active={
                            fillMode ===
                            "manual"
                        }
                        onClick={() =>
                            onFillModeChange(
                                "manual"
                            )
                        }
                    >
                        Вручную
                    </FillModeButton>
                </FillModeSwitch>
            </LeadDataHeader>

            <LeadFields>
                <LeadField>
                    <label>
                        Имя
                    </label>

                    <LeadInput
                        name="name"
                        value={leadData.name}
                        onChange={onChange}
                        placeholder="Анна"
                    />
                </LeadField>

                <LeadField>
                    <label>
                        Телефон
                    </label>

                    <LeadInput
                        name="phone"
                        value={leadData.phone}
                        onChange={onChange}
                        placeholder="+7 999 000-00-00"
                    />
                </LeadField>

                <LeadField>
                    <label>
                        Email
                    </label>

                    <LeadInput
                        name="email"
                        value={leadData.email}
                        onChange={onChange}
                        placeholder="mail@example.ru"
                    />
                </LeadField>
            </LeadFields>
            <LeadField>
                <label>
                    Тема письма
                </label>

                <LeadInput
                    name="subject"
                    value={
                        leadData.subject
                    }
                    onChange={
                        onChange
                    }
                    placeholder="Тема обращения"
                />
            </LeadField>
            <LeadField>
                <label>
                    Комментарий
                </label>

                <LeadTextarea
                    name="message"
                    value={leadData.message}
                    onChange={onChange}
                    placeholder="Введите текст заявки..."
                />
            </LeadField>
        </LeadDataCard>
    );
};
