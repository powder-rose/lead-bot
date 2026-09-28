import styled from "styled-components";

import {
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";


export const Topbar = styled.header`
    padding: 42px 48px 28px;

    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 30px;

    @media (max-width: 700px) {
        padding: 28px 20px 20px;
    }
`;

export const Eyebrow = styled.div`
    margin-bottom: 7px;

    color: ${MUTED};

    font-size: 11px;
    font-weight: 500;
`;

export const PageTitle = styled.h1`
    margin: 0;

    color: ${TEXT};

    font-size: clamp(30px, 4vw, 42px);
    font-weight: 650;

    letter-spacing: -1.7px;
`;

export const PageSubtitle = styled.div`
    margin-top: 9px;

    color: #777777;

    font-size: 14px;
    line-height: 1.5;
`;

export const EnvironmentBadge = styled.div`
    padding: 9px 12px;

    display: flex;
    align-items: center;
    gap: 8px;

    border: 1px solid ${BORDER};
    border-radius: 12px;

    background: #ffffff;

    color: #666666;

    font-size: 11px;
    font-weight: 500;

    i {
        width: 7px;
        height: 7px;

        border-radius: 50%;

        background: #59b982;
    }

    @media (max-width: 700px) {
        display: none;
    }
`;
