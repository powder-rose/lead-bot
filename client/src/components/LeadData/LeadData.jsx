import {
    LeadDataCard,
    LeadDataHeader,
    LeadFields,
    LeadField,
    LeadInput,
    LeadTextarea,
} from "./LeadData.styles.js";

export const LeadData = ({
    leadData,
    onChange,
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
