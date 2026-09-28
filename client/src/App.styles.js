import styled from "styled-components";

import {
    TEXT,
    BACKGROUND,
} from "./styles/theme.js";


export const AppShell = styled.div`
    min-height: 100vh;

    display: grid;
    grid-template-columns: 230px minmax(0, 1fr);

    background: ${BACKGROUND};
    color: ${TEXT};

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

export const Workspace = styled.main`
    min-width: 0;
`;

export const Content = styled.div`
    width: min(1180px, calc(100% - 96px));
    margin: 0 auto 80px;

    @media (max-width: 700px) {
        width: calc(100% - 40px);
    }
`;
