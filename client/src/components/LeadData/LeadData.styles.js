import styled from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";


export const LeadDataCard = styled.section`
    margin-top: 16px;
    padding: 28px;

    border: 1px solid ${BORDER};
    border-radius: 20px;

    background: #ffffff;
`;

export const LeadDataHeader = styled.div`

    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;

    @media (max-width: 700px) {
    flex-direction: column;
    }

    margin-bottom: 22px;

    span {
        display: block;

        margin-bottom: 6px;

        color: ${PINK_DARK};

        font-size: 9px;
        font-weight: 700;

        letter-spacing: 0.8px;
    }

    h3 {
        margin: 0;

        color: ${TEXT};

        font-size: 19px;
        font-weight: 600;

        letter-spacing: -0.4px;
    }

    p {
        margin: 6px 0 0;

        color: ${MUTED};

        font-size: 11px;
        line-height: 1.5;
    }
`;

export const LeadFields = styled.div`
    display: grid;

    grid-template-columns: repeat(
        4,
        minmax(0, 1fr)
    );

    gap: 10px;

    margin-bottom: 10px;

    @media (max-width: 1100px) {
        grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
        );
    }

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }
`;

export const LeadField = styled.div`
    label {
        display: block;

        margin-bottom: 7px;

        color: #777777;

        font-size: 10px;
        font-weight: 500;
    }
`;

export const LeadInput = styled.input`
    width: 100%;
    height: 48px;

    padding: 0 14px;

    border: 1px solid #dedede;
    border-radius: 12px;

    outline: none;

    background: #f7f7f7;
    color: ${TEXT};

    font-size: 12px;

    transition:
        border-color 0.15s,
        background 0.15s,
        box-shadow 0.15s;

    &:focus {
        border-color: ${PINK};

        background: #ffffff;

        box-shadow: 0 0 0 4px
            rgba(243, 167, 184, 0.12);
    }

    &::placeholder {
        color: #b4b4b4;
    }
`;

export const LeadTextarea = styled.textarea`
    width: 100%;
    min-height: 100px;

    padding: 14px;

    resize: vertical;

    border: 1px solid #dedede;
    border-radius: 12px;

    outline: none;

    background: #f7f7f7;
    color: ${TEXT};

    font-size: 12px;
    line-height: 1.5;

    transition:
        border-color 0.15s,
        background 0.15s,
        box-shadow 0.15s;

    &:focus {
        border-color: ${PINK};

        background: #ffffff;

        box-shadow: 0 0 0 4px
            rgba(243, 167, 184, 0.12);
    }

    &::placeholder {
        color: #b4b4b4;
    }
`;
export const FillModeSwitch = styled.div`
    padding: 4px;

    display: flex;
    gap: 4px;

    border: 1px solid ${BORDER};
    border-radius: 12px;

    background: #f7f7f7;
`;


export const FillModeButton = styled.button`
    height: 34px;

    padding: 0 12px;

    border: 0;
    border-radius: 9px;

    cursor: pointer;

    background: ${
        ({
            $active,
        }) =>
            $active
                ? "#ffffff"
                : "transparent"
    };

    color: ${
        ({
            $active,
        }) =>
            $active
                ? PINK_DARK
                : MUTED
    };

    box-shadow: ${
        ({
            $active,
        }) =>
            $active
                ? "0 2px 8px rgba(0, 0, 0, 0.06)"
                : "none"
    };

    font-size: 10px;
    font-weight: 600;

    transition: 0.15s;
`;