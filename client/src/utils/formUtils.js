export const normalizeUrl = (url) => {
    const value = url.trim();

    if (!value) {
        return "";
    }

    if (
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        return value;
    }

    return `https://${value}`;
};

export const getDomain = (url) => {
    try {
        return new URL(url)
            .hostname
            .replace(/^www\./, "");
    } catch {
        return url;
    }
};

export const getFieldType = (field) => {
    const value = [
        field?.name,
        field?.id,
        field?.placeholder,
        field?.ariaLabel,
        field?.label,
        field?.type,
        field?.surroundingText,
        field?.autocomplete,
        field?.inputMode,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

    if (
        field?.type === "tel" ||
        field?.inputMode === "tel" ||
        field?.autocomplete === "tel" ||
        value.includes("phone") ||
        value.includes("telephone") ||
        value.includes("mobile") ||
        value.includes("телефон") ||
        value.includes("тел.") ||
        value.includes("номер телефона")
    ) {
        return {
            label: "Телефон",
            type: "phone",
        };
    }

    if (
        field?.type === "email" ||
        field?.autocomplete === "email" ||
        value.includes("email") ||
        value.includes("e-mail") ||
        value.includes("почта") ||
        value.includes("электронная почта")
    ) {
        return {
            label: "Email",
            type: "email",
        };
    }

    if (
        field?.autocomplete === "name" ||
        value.includes("name") ||
        value.includes("fullname") ||
        value.includes("fio") ||
        value.includes("имя") ||
        value.includes("фио") ||
        value.includes("как вас зовут") ||
        value.includes("как к вам обращаться")
    ) {
        return {
            label: "Имя",
            type: "name",
        };
    }

    if (
        field?.tag === "textarea" ||
        value.includes("message") ||
        value.includes("comment") ||
        value.includes("question") ||
        value.includes("description") ||
        value.includes("сообщение") ||
        value.includes("комментар") ||
        value.includes("вопрос") ||
        value.includes("напишите")
    ) {
        return {
            label: "Сообщение",
            type: "message",
        };
    }

    if (field?.type === "checkbox") {
        return {
            label: "Checkbox",
            type: "checkbox",
        };
    }

    if (field?.type === "radio") {
        return {
            label: "Radio",
            type: "radio",
        };
    }

    return {
        label: "Не определено",
        type: "unknown",
    };
};
