import {
    Content,
} from "../../App.styles.js";

import {
    Header,
} from "../../components/Header/Header.jsx";

import {
    ComingSoon,
} from "../../components/ComingSoon/ComingSoon.jsx";


export const HistoryPage = () => {
    return (
        <>
            <Header
                eyebrow="LeadBot"
                title="История"
                subtitle="Результаты сканирования и выполненных действий"
            />

            <Content>
                <ComingSoon
                    kicker="ИСТОРИЯ"
                    title="История обработки"
                >
                    Здесь появится журнал компаний, найденных форм, тестов, ошибок и будущих статусов отправки.
                </ComingSoon>
            </Content>
        </>
    );
};
