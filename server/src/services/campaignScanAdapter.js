const INTERNAL_API_URL =
    process.env.LEADBOT_INTERNAL_API_URL ||
    `http://127.0.0.1:${process.env.PORT || 3000}`;

const SCAN_TIMEOUT_MS =
    Math.max(
        Number(process.env.CAMPAIGN_SCAN_TIMEOUT_MS) || 90000,
        10000
    );

const sanitizeField = (field = {}) => ({
    name: field.name || "",
    type: field.type || "",
    placeholder: field.placeholder || "",
    label: field.label || "",
    required: Boolean(field.required),
});

const sanitizeButton = (button = {}) => ({
    text: button.text || "",
    type: button.type || "",
});

const sanitizeForm = (form = {}) => ({
    formIndex: form.formIndex ?? null,
    pageUrl: form.pageUrl || "",
    source: form.source || "page",
    method: form.method || "",
    score: Number(form.score || 0),
    recommended: Boolean(form.recommended),
    trigger: form.trigger || null,
    fields: Array.isArray(form.fields)
        ? form.fields.slice(0, 30).map(sanitizeField)
        : [],
    buttons: Array.isArray(form.buttons)
        ? form.buttons.slice(0, 10).map(sanitizeButton)
        : [],
});

export const sanitizeCampaignScanResult = (result = {}) => {
    const forms = Array.isArray(result.forms)
        ? result.forms.slice(0, 5).map(sanitizeForm)
        : [];

    const serialized = JSON.stringify(forms).toLowerCase();

    const hasCaptcha = /captcha|recaptcha|hcaptcha|smartcaptcha|капча/.test(
        serialized
    );

    const bestForm = forms[0] || null;

    return {
        url: result.url || "",
        title: result.title || "",
        forms,
        formsCount: Number(result.formsCount ?? forms.length ?? 0),
        scanPageUrl: bestForm?.pageUrl || result.url || "",
        bestFormScore: Number(bestForm?.score || 0),
        hasCaptcha,
    };
};

export const scanWebsiteThroughLeadBot = async (website) => {
    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        SCAN_TIMEOUT_MS
    );

    try {
        const response = await fetch(
            `${INTERNAL_API_URL}/api/scan`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: website,
                }),
                signal: controller.signal,
            }
        );

        let payload;

        try {
            payload = await response.json();
        } catch {
            throw new Error(
                `Сканер вернул ответ ${response.status} без JSON`
            );
        }

        if (!response.ok || payload.error) {
            throw new Error(
                payload.error ||
                `Ошибка сканера: HTTP ${response.status}`
            );
        }

        return sanitizeCampaignScanResult(payload.data || {});
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(
                `Сканирование превысило ${Math.round(
                    SCAN_TIMEOUT_MS / 1000
                )} сек.`
            );
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
};
