import styled from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";


export const EmptyState = styled.div`
    margin-top: 16px;
    padding: 26px;

    display: flex;
    align-items: center;
    gap: 16px;

    border-radius: 18px;

    background: #ffffff;
    border: 1px solid ${BORDER};

    strong,
    span {
        display: block;
    }

    strong {
        margin-bottom: 4px;

        color: ${TEXT};

        font-size: 13px;
        font-weight: 600;
    }

    span {
        color: ${MUTED};

        font-size: 11px;
    }
`;

export const EmptyIcon = styled.div`
    width: 42px;
    height: 42px;

    flex: 0 0 auto;

    display: grid;
    place-items: center;

    border-radius: 12px;

    background: #fff0f4;
    color: ${PINK_DARK};

    font-size: 18px;
`;

export const ResultSection = styled.section`
    margin-top: 34px;
`;

export const ResultHeader = styled.div`
    margin-bottom: 20px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
`;

export const SiteIdentity = styled.div`
    display: flex;
    align-items: center;
    gap: 13px;
`;

export const SiteAvatar = styled.div`
    width: 48px;
    height: 48px;

    display: grid;
    place-items: center;

    border-radius: 14px;

    background: ${PINK};
    color: #ffffff;

    font-size: 18px;
    font-weight: 700;
`;

export const SiteInfo = styled.div`
    > span {
        display: block;

        margin-bottom: 3px;

        color: ${MUTED};

        font-size: 9px;
        font-weight: 600;

        text-transform: uppercase;
        letter-spacing: 0.7px;
    }

    strong {
        display: block;

        max-width: 700px;

        overflow: hidden;

        color: ${TEXT};

        font-size: 15px;
        font-weight: 600;

        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

export const SiteUrl = styled.a`
    margin-top: 4px;

    display: inline-flex;
    gap: 5px;

    color: #777777;

    font-size: 11px;

    text-decoration: none;

    &:hover {
        color: ${PINK_DARK};
    }
`;

export const ScanStatus = styled.div`
    padding: 8px 11px;

    display: flex;
    align-items: center;
    gap: 7px;

    border-radius: 10px;

    background: #eef9f2;
    color: #278354;

    font-size: 10px;
    font-weight: 600;

    i {
        width: 6px;
        height: 6px;

        border-radius: 50%;

        background: #36a86b;
    }

    @media (max-width: 600px) {
        display: none;
    }
`;

export const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;

    margin-bottom: 16px;

    @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 500px) {
        grid-template-columns: 1fr;
    }
`;

export const StatCard = styled.div`
    padding: 20px;

    border-radius: 16px;

    background: #ffffff;
    border: 1px solid ${BORDER};
`;

export const StatLabel = styled.div`
    color: ${MUTED};

    font-size: 10px;
    font-weight: 500;
`;

export const StatValue = styled.div`
    margin: 7px 0 3px;

    color: ${TEXT};

    font-size: 30px;
    font-weight: 650;

    letter-spacing: -1px;
`;

export const StatHint = styled.div`
    color: #b0b0b0;

    font-size: 10px;
`;

export const EmptyFormState = styled.div`
    padding: 28px;

    display: flex;
    flex-direction: column;
    gap: 5px;

    border-radius: 17px;

    background: #ffffff;
    border: 1px solid ${BORDER};

    strong {
        color: ${TEXT};

        font-size: 13px;
        font-weight: 600;
    }

    span {
        color: ${MUTED};

        font-size: 11px;
        line-height: 1.6;
    }
`;
