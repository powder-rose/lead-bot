import styled, { keyframes } from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    BORDER,
} from "../../styles/theme.js";

const spin = keyframes`
    to {
        transform: rotate(360deg);
    }
`;


export const HeroCard = styled.section`
    position: relative;

    padding: 34px;

    overflow: hidden;

    border: 1px solid ${BORDER};
    border-radius: 24px;

    background: #ffffff;

    @media (max-width: 600px) {
        padding: 24px;
    }
`;

export const HeroGlow = styled.div`
    position: absolute;

    width: 280px;
    height: 280px;

    top: -190px;
    right: -100px;

    border-radius: 50%;

    background: rgba(243, 167, 184, 0.16);

    filter: blur(35px);

    pointer-events: none;
`;

export const HeroHeader = styled.div`
    position: relative;

    max-width: 680px;
`;

export const HeroKicker = styled.div`
    margin-bottom: 12px;

    color: ${PINK_DARK};

    font-size: 10px;
    font-weight: 700;

    letter-spacing: 0.7px;
`;

export const HeroTitle = styled.h2`
    margin: 0;

    color: ${TEXT};

    font-size: 28px;
    font-weight: 650;

    letter-spacing: -0.8px;
`;

export const HeroText = styled.p`
    max-width: 660px;

    margin: 11px 0 0;

    color: #777777;

    font-size: 14px;
    line-height: 1.65;
`;

export const ScanForm = styled.form`
    position: relative;

    margin-top: 28px;

    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;

    @media (max-width: 650px) {
        grid-template-columns: 1fr;
    }
`;

export const UrlField = styled.div`
    height: 56px;

    display: flex;
    align-items: center;

    overflow: hidden;

    border: 1px solid #dedede;
    border-radius: 14px;

    background: #f7f7f7;

    transition:
        border-color 0.15s,
        background 0.15s,
        box-shadow 0.15s;

    &:focus-within {
        border-color: ${PINK};

        background: #ffffff;

        box-shadow: 0 0 0 4px
            rgba(243, 167, 184, 0.14);
    }
`;

export const UrlPrefix = styled.span`
    padding-left: 17px;

    color: #a0a0a0;

    font-size: 14px;

    user-select: none;
`;

export const UrlInput = styled.input`
    flex: 1;
    min-width: 0;
    height: 100%;

    padding: 0 17px 0 3px;

    border: 0;
    outline: 0;

    background: transparent;
    color: ${TEXT};

    font-size: 14px;

    &::placeholder {
        color: #b4b4b4;
    }
`;

export const ScanButton = styled.button`
    min-width: 180px;
    height: 56px;

    padding: 0 22px;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    border: 0;
    border-radius: 14px;

    background: ${PINK};
    color: #ffffff;

    cursor: pointer;

    font-size: 13px;
    font-weight: 600;

    transition:
        background 0.15s,
        transform 0.15s,
        box-shadow 0.15s;

    span {
        font-size: 18px;
    }

    &:hover:not(:disabled) {
        background: ${PINK_DARK};

        transform: translateY(-1px);

        box-shadow: 0 8px 20px
            rgba(217, 133, 154, 0.2);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }
`;

export const Spinner = styled.i`
    width: 15px;
    height: 15px;

    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;

    animation: ${spin} 0.7s linear infinite;
`;

export const ErrorBox = styled.div`
    margin-top: 16px;
    padding: 14px 16px;

    display: flex;
    flex-direction: column;
    gap: 4px;

    border-radius: 12px;

    background: #fff1f4;
    color: #a44f64;

    font-size: 12px;
`;
