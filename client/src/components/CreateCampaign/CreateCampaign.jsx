import { useEffect, useState } from "react";
import { createCampaign } from "../../api/campaignsApi.js";
import {
    Actions,
    CancelButton,
    Counter,
    Field,
    Form,
    Input,
    Modal,
    Overlay,
    SaveButton,
    Subtitle,
    Textarea,
    Title,
    Top,
    CloseButton,
    ErrorBox,
} from "./CreateCampaign.styles.js";

const SENDER_KEY = "leadbot:campaignSender";

const getSavedSender = () => {
    try {
        return JSON.parse(localStorage.getItem(SENDER_KEY) || "{}") || {};
    } catch {
        return {};
    }
};

export const CreateCampaign = ({
    open,
    onClose,
    onCreated,
    selection,
    selectedCount,
    suggestedName = "Новая кампания",
}) => {
    const saved = getSavedSender();

    const [name, setName] = useState(suggestedName);
    const [senderName, setSenderName] = useState(saved.senderName || "");
    const [senderPhone, setSenderPhone] = useState(saved.senderPhone || "");
    const [senderEmail, setSenderEmail] = useState(saved.senderEmail || "");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) return;

        setName(suggestedName || "Новая кампания");
        setMessage("");
        setError(null);
    }, [open, suggestedName]);

    if (!open) return null;

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!name.trim()) {
            setError("Введите название кампании");
            return;
        }

        if (!message.trim()) {
            setError("Введите текст обращения");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            localStorage.setItem(
                SENDER_KEY,
                JSON.stringify({
                    senderName,
                    senderPhone,
                    senderEmail,
                })
            );

            const campaign = await createCampaign({
                name: name.trim(),
                senderName: senderName.trim(),
                senderPhone: senderPhone.trim(),
                senderEmail: senderEmail.trim(),
                message: message.trim(),
                selection,
            });

            onCreated?.(campaign);
        } catch (error) {
            setError(error.message || "Не удалось создать кампанию");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Overlay
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving) {
                    onClose?.();
                }
            }}
        >
            <Modal>
                <Top>
                    <div>
                        <Title>Создать кампанию</Title>
                        <Subtitle>
                            Сохраняем выбранные компании и текст обращения. Отправка форм пока не запускается.
                        </Subtitle>
                    </div>

                    <CloseButton
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                    >
                        ×
                    </CloseButton>
                </Top>

                <Counter>
                    Компаний в кампании: <strong>{selectedCount.toLocaleString("ru-RU")}</strong>
                </Counter>

                <Form onSubmit={handleSubmit}>
                    <Field>
                        <span>Название кампании *</span>
                        <Input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Пожарная безопасность — Москва"
                            autoFocus
                        />
                    </Field>

                    <Field>
                        <span>Имя отправителя</span>
                        <Input
                            value={senderName}
                            onChange={(event) => setSenderName(event.target.value)}
                            placeholder="Николай Бойков"
                        />
                    </Field>

                    <Field>
                        <span>Телефон</span>
                        <Input
                            value={senderPhone}
                            onChange={(event) => setSenderPhone(event.target.value)}
                            placeholder="+7 999 000-00-00"
                        />
                    </Field>

                    <Field>
                        <span>Email</span>
                        <Input
                            type="email"
                            value={senderEmail}
                            onChange={(event) => setSenderEmail(event.target.value)}
                            placeholder="mail@example.ru"
                        />
                    </Field>

                    <Field>
                        <span>Текст обращения *</span>
                        <Textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Введите текст, который позднее будет использоваться при заполнении форм..."
                            maxLength={5000}
                        />
                        <small>{message.length.toLocaleString("ru-RU")} / 5 000</small>
                    </Field>

                    {error && <ErrorBox>{error}</ErrorBox>}

                    <Actions>
                        <CancelButton
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Отмена
                        </CancelButton>

                        <SaveButton type="submit" disabled={saving || selectedCount <= 0}>
                            {saving ? "Создаём..." : "Создать кампанию"}
                        </SaveButton>
                    </Actions>
                </Form>
            </Modal>
        </Overlay>
    );
};
