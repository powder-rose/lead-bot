import styled from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";


export const FormCard = styled.article`
    margin-top: 12px;
    padding: 24px;

    border-radius: 20px;

    background: #ffffff;
    border: 1px solid ${BORDER};
`;

export const FormCardHeader = styled.div`
    padding-bottom: 20px;

    display: flex;
    justify-content: space-between;
    gap: 20px;

    border-bottom: 1px solid ${BORDER};
`;

export const FormNumber = styled.div`
    margin-bottom: 5px;

    color: ${PINK_DARK};

    font-size: 9px;
    font-weight: 700;
`;

export const FormTitle = styled.h3`
    margin: 0;

    color: ${TEXT};

    font-size: 17px;
    font-weight: 600;
`;

export const FormStatus = styled.div`
    height: fit-content;

    padding: 8px 10px;

    display: flex;
    align-items: center;
    gap: 6px;

    border-radius: 10px;

    background: ${({ $type }) =>
    $type === "success"
        ? "#eef9f2"
        : $type === "warning"
            ? "#fff7e5"
            : "#f3f3f3"};

    color: ${({ $type }) =>
    $type === "success"
        ? "#278354"
        : $type === "warning"
            ? "#9b7419"
            : "#777777"};

    font-size: 9px;
    font-weight: 600;

    i {
        width: 5px;
        height: 5px;

        border-radius: 50%;

        background: currentColor;
    }
`;

export const MetaRow = styled.div`
    margin-top: 10px;

    display: flex;
    flex-wrap: wrap;
    gap: 6px;
`;

export const MetaChip = styled.div`
    padding: 5px 7px;

    border-radius: 6px;

    background: #f4f4f4;
    color: #777777;

    font-size: 9px;
    font-weight: 500;
`;

export const FieldsGrid = styled.div`
    margin-top: 20px;

    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }
`;

export const FieldCard = styled.div`
    padding: 15px;

    border-radius: 13px;

    background: #f7f7f7;
`;

export const FieldTop = styled.div`
    margin-bottom: 13px;

    display: flex;
    align-items: center;
    gap: 6px;
`;

export const FieldTypeBadge = styled.span`
    padding: 5px 8px;

    border-radius: 7px;

    background: ${({ $type }) => {
    if ($type === "phone") return "#eaf8ef";
    if ($type === "name") return "#fff0f4";
    if ($type === "email") return "#f3f0ff";
    if ($type === "message") return "#edf7fa";
    if ($type === "checkbox") return "#fff5dc";
    if ($type === "hidden") return "#ededed";

    return "#f2f2f2";
}};

    color: ${({ $type }) => {
    if ($type === "phone") return "#278354";
    if ($type === "name") return PINK_DARK;
    if ($type === "email") return "#7257b1";
    if ($type === "message") return "#367c92";
    if ($type === "checkbox") return "#967018";

    return "#777777";
}};

    font-size: 9px;
    font-weight: 600;
`;

export const RequiredBadge = styled.span`
    color: #999999;

    font-size: 9px;
`;

export const FieldDetails = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 15px;
`;

export const Detail = styled.div`
    min-width: 0;
`;

export const DetailLabel = styled.div`
    margin-bottom: 3px;

    color: #aaaaaa;

    font-size: 8px;
    font-weight: 500;
`;

export const DetailValue = styled.div`
    overflow: hidden;

    color: #555555;

    font-size: 10px;

    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ButtonsSection = styled.div`
    margin-top: 20px;
    padding-top: 18px;

    border-top: 1px solid ${BORDER};

    > span {
        display: block;

        margin-bottom: 9px;

        color: ${MUTED};

        font-size: 9px;
        font-weight: 600;
    }
`;

export const SubmitPreview = styled.button`
    width: 100%;

    margin-top: 6px;
    padding: 12px 13px;

    display: flex;
    justify-content: space-between;

    border: 0;
    border-radius: 10px;

    background: #f5f5f5;
    color: #555555;

    span {
        font-size: 10px;
    }

    small {
        color: #999999;

        font-size: 9px;
    }
`;

export const TestFillButton = styled.button`
    width: 100%;
    height: 46px;

    margin-top: 18px;

    padding: 0 15px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    border: 0;
    border-radius: 12px;

    background: #fff0f4;
    color: ${PINK_DARK};

    cursor: pointer;

    font-size: 11px;
    font-weight: 600;

    transition:
        background 0.15s,
        transform 0.15s;

    span {
        font-size: 16px;
    }

    &:hover:not(:disabled) {
        background: #fce5eb;

        transform: translateY(-1px);
    }

    &:disabled {
        cursor: default;
        opacity: 0.6;
    }
`;

export const TestResultCard = styled.div`
    margin-top: 12px;
    padding: 16px;

    border-radius: 14px;

    background: #f8f8f8;
`;

export const TestResultHeader = styled.div`
    margin-bottom: 14px;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    strong,
    span {
        display: block;
    }

    strong {
        color: ${TEXT};

        font-size: 11px;
        font-weight: 600;
    }

    div > span {
        margin-top: 3px;

        color: ${MUTED};

        font-size: 9px;
    }

    > span {
        padding: 6px 8px;

        border-radius: 8px;

        background: #eef9f2;
        color: #278354;

        font-size: 9px;
        font-weight: 600;
    }
`;

export const TestScreenshot = styled.img`
    display: block;

    max-width: 100%;
    max-height: 650px;

    margin: 0 auto;

    border-radius: 10px;

    border: 1px solid #e4e4e4;

    object-fit: contain;
`;

export const TestError = styled.div`
    margin-top: 10px;
    padding: 11px 13px;
    border-radius: 10px;
    background: #fff0f2;
    color: #a85365;
    font-size: 10px;
`;

export const FormScore = styled.div`
    margin-top: 10px;

    display: flex;
    align-items: baseline;
    gap: 7px;

    strong {
        color: ${PINK_DARK};

        font-size: 19px;
        font-weight: 650;
    }

    span {
        color: ${MUTED};

        font-size: 9px;
    }
`;

export const RecommendedBadge = styled.div`
    height: fit-content;

    padding: 8px 11px;

    display: flex;
    align-items: center;
    gap: 6px;

    border-radius: 10px;

    background: #fff0f4;
    color: ${PINK_DARK};

    font-size: 9px;
    font-weight: 600;

    i {
        width: 6px;
        height: 6px;

        border-radius: 50%;

        background: ${PINK};
    }
`;

export const ScoreReasons = styled.div`
    margin-top: 12px;

    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    span {
        padding: 6px 8px;

        border-radius: 7px;

        background: #f6f6f6;
        color: #777777;

        font-size: 9px;

        &::before {
            content: "✓";

            margin-right: 5px;

            color: #51a879;
        }
    }
`;

export const SendButton = styled.button`
    width: 100%;
    height: 50px;

    margin-top: 10px;
    padding: 0 16px;

    display: flex;
    align-items: center;
    justify-content: space-between;

    border: 0;
    border-radius: 12px;

    background: ${PINK};
    color: #ffffff;

    cursor: pointer;

    font-size: 11px;
    font-weight: 600;

    transition:
        background 0.15s,
        transform 0.15s;

    span {
        font-size: 17px;
    }

    &:hover:not(:disabled) {
        background: ${PINK_DARK};

        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        cursor: default;
        opacity: 0.6;
    }
`;

export const SendResult = styled.div`
    margin-top: 12px;
    padding: 16px;

    border-radius: 13px;

    background: ${({ $status }) =>
    $status === "confirmed"
        ? "#eef9f2"
        : $status === "captcha"
            ? "#fff7e5"
            : $status === "likely"
                ? "#f5f3ff"
                : "#f7f7f7"};

    strong,
    > span {
        display: block;
    }

    strong {
        color: ${({ $status }) =>
    $status === "confirmed"
        ? "#278354"
        : $status === "captcha"
            ? "#9b7419"
            : $status === "likely"
                ? "#7257b1"
                : TEXT};

        font-size: 11px;
        font-weight: 600;
    }

    > span {
        margin-top: 5px;

        color: #777777;

        font-size: 10px;
        line-height: 1.55;
    }

    img {
        margin-top: 14px;
    }
`;
