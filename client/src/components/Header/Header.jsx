import {
    Topbar,
    Eyebrow,
    PageTitle,
    PageSubtitle,
    EnvironmentBadge,
} from "./Header.styles.js";


export const Header = ({
    eyebrow = "LeadBot",
    title,
    subtitle,
    showServerStatus = true,
}) => {
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
                <EnvironmentBadge>
                    <i />

                    Сервер подключён
                </EnvironmentBadge>
            )}
        </Topbar>
    );
};
