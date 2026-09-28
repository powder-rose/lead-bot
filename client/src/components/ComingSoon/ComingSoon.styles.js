import styled from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";


export const ComingSoonCard = styled.section`
    min-height: 240px;
    padding: 34px;

    display: flex;
    align-items: flex-start;
    gap: 20px;

    border: 1px solid ${BORDER};
    border-radius: 24px;

    background: #ffffff;

    @media (max-width: 600px) {
        padding: 24px;
    }
`;

export const ComingSoonIcon = styled.div`
    width: 48px;
    height: 48px;

    flex: 0 0 auto;

    display: grid;
    place-items: center;

    border-radius: 14px;

    background: #fff0f4;
    color: ${PINK_DARK};

    font-size: 22px;
    font-weight: 500;
`;

export const ComingSoonKicker = styled.div`
    margin-bottom: 8px;

    color: ${PINK_DARK};

    font-size: 9px;
    font-weight: 700;

    letter-spacing: 0.8px;
`;

export const ComingSoonTitle = styled.h2`
    margin: 0;

    color: ${TEXT};

    font-size: 23px;
    font-weight: 650;

    letter-spacing: -0.6px;
`;

export const ComingSoonText = styled.p`
    max-width: 650px;

    margin: 10px 0 0;

    color: ${MUTED};

    font-size: 12px;
    line-height: 1.7;
`;
