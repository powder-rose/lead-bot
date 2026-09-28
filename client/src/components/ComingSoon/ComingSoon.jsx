import {
    ComingSoonCard,
    ComingSoonIcon,
    ComingSoonKicker,
    ComingSoonTitle,
    ComingSoonText,
} from "./ComingSoon.styles.js";


export const ComingSoon = ({
    kicker = "СЛЕДУЮЩИЙ МОДУЛЬ",
    title,
    children,
}) => {
    return (
        <ComingSoonCard>
            <ComingSoonIcon>
                +
            </ComingSoonIcon>

            <div>
                <ComingSoonKicker>
                    {kicker}
                </ComingSoonKicker>

                <ComingSoonTitle>
                    {title}
                </ComingSoonTitle>

                <ComingSoonText>
                    {children}
                </ComingSoonText>
            </div>
        </ComingSoonCard>
    );
};
