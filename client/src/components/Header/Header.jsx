import {
    useEffect,
    useState,
} from "react";

import {
    API_URL,
} from "../../constants/api.js";

import {
    Topbar,
    Eyebrow,
    PageTitle,
    PageSubtitle,
    EnvironmentBadge,
} from "./Header.styles.js";

const HEALTH_CHECK_INTERVAL_MS = 10000;
const HEALTH_CHECK_TIMEOUT_MS = 3000;

export const Header = ({
    eyebrow = "LeadBot",
    title,
    subtitle,
    showServerStatus = true,
}) => {
    const [
        serverStatus,
        setServerStatus,
    ] = useState("checking");

    useEffect(() => {
        if (!showServerStatus) {
            return undefined;
        }

        let isMounted = true;

        const checkServerHealth = async () => {
            const controller =
                new AbortController();

            const timeoutId =
                window.setTimeout(
                    () => controller.abort(),
                    HEALTH_CHECK_TIMEOUT_MS
                );

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/health`,
                        {
                            cache: "no-store",
                            signal: controller.signal,
                        }
                    );

                const payload =
                    await response.json();

                const isConnected =
                    response.ok &&
                    payload?.data?.status === "ok";

                if (isMounted) {
                    setServerStatus(
                        isConnected
                            ? "connected"
                            : "disconnected"
                    );
                }
            } catch {
                if (isMounted) {
                    setServerStatus(
                        "disconnected"
                    );
                }
            } finally {
                window.clearTimeout(
                    timeoutId
                );
            }
        };

        checkServerHealth();

        const intervalId =
            window.setInterval(
                checkServerHealth,
                HEALTH_CHECK_INTERVAL_MS
            );

        return () => {
            isMounted = false;

            window.clearInterval(
                intervalId
            );
        };
    }, [showServerStatus]);

    const statusLabel =
        serverStatus === "connected"
            ? "Сервер подключён"
            : serverStatus === "disconnected"
              ? "Нет соединения"
              : "Проверяем сервер...";

    return (
        <Topbar>
            <div>
                <Eyebrow>
                    {eyebrow}
                </Eyebrow>

                <PageTitle>
                    {title}
                </PageTitle>

                {subtitle && (
                    <PageSubtitle>
                        {subtitle}
                    </PageSubtitle>
                )}
            </div>

            {showServerStatus && (
                <EnvironmentBadge
                    $status={
                        serverStatus
                    }
                    role="status"
                    aria-live="polite"
                    title={
                        serverStatus ===
                        "disconnected"
                            ? "LeadBot не получает ответ от backend"
                            : undefined
                    }
                >
                    <i />

                    {statusLabel}
                </EnvironmentBadge>
            )}
        </Topbar>
    );
};
