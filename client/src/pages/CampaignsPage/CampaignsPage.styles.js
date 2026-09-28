import styled from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";

export const HeaderRow = styled.div`
    margin-bottom: 14px;
`;

export const Stats = styled.div`
    display: flex;
    align-items: stretch;
    gap: 8px;
    flex-wrap: wrap;
`;

export const Stat = styled.div`
    min-width: 110px;
    padding: 10px 12px;
    border: 1px solid ${BORDER};
    border-radius: 11px;
    background: #ffffff;

    strong,
    span {
        display: block;
    }

    strong {
        color: ${TEXT};
        font-size: 14px;
        font-weight: 650;
    }

    span {
        margin-top: 3px;
        color: ${MUTED};
        font-size: 8px;
    }
`;

export const ScanHint = styled.div`
    margin-bottom: 14px;
    padding: 11px 13px;
    border: 1px solid #f1d9df;
    border-radius: 11px;
    background: #fffafb;
    color: #7a646a;
    font-size: 9px;
    line-height: 1.5;
`;

export const CampaignGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(
        auto-fit,
        minmax(360px, 1fr)
    );
    gap: 12px;

    @media (max-width: 500px) {
        grid-template-columns: 1fr;
    }
`;

export const CampaignCard = styled.article`
    min-width: 0;
    padding: 18px;
    border: 1px solid ${BORDER};
    border-radius: 18px;
    background: #ffffff;
`;

export const CampaignMeta = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    > span {
        color: ${MUTED};
        font-size: 8px;
    }
`;

export const CampaignName = styled.h3`
    margin: 14px 0 0;
    color: ${TEXT};
    font-size: 16px;
    font-weight: 650;
    letter-spacing: -0.3px;
`;

export const CampaignText = styled.p`
    min-height: 38px;
    margin: 8px 0 0;
    display: -webkit-box;
    overflow: hidden;
    color: #777777;
    font-size: 9px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
`;

export const ProgressMeta = styled.div`
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: ${MUTED};
    font-size: 8px;

    strong {
        color: ${TEXT};
        font-size: 9px;
    }
`;

export const ProgressBar = styled.div`
    width: 100%;
    height: 7px;
    margin-top: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: #f1f1f1;
`;

export const ProgressFill = styled.div`
    width: ${({ $value }) => Math.min(Math.max(Number($value) || 0, 0), 100)}%;
    height: 100%;
    border-radius: inherit;
    background: ${PINK_DARK};
    transition: width 0.35s ease;
`;

export const StatusBadge = styled.span`
    display: inline-flex;
    align-items: center;
    min-height: 27px;
    padding: 0 9px;
    border-radius: 8px;
    background: ${({ $status }) => {
        if ($status === "running" || $status === "scanning") return "#fff0f4";
        if ($status === "completed" || $status === "form_found" || $status === "test_filled") return "#eef9f2";
        if ($status === "error") return "#fff0f2";
        if ($status === "paused") return "#fff8e8";
        if ($status === "no_form" || $status === "no_site") return "#f3f3f3";
        return "#f6f6f6";
    }};
    color: ${({ $status }) => {
        if ($status === "running" || $status === "scanning") return PINK_DARK;
        if ($status === "completed" || $status === "form_found" || $status === "test_filled") return "#278354";
        if ($status === "error") return "#a85365";
        if ($status === "paused") return "#9b7a2d";
        return "#747474";
    }};
    font-size: 8px;
    font-weight: 650;
    white-space: nowrap;
`;

export const CampaignActions = styled.div`
    margin-top: 16px;
    padding-top: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    border-top: 1px solid ${BORDER};
`;

export const ActionButton = styled.button`
    min-height: 34px;
    padding: 0 11px;
    border: 1px solid ${BORDER};
    border-radius: 9px;
    background: #ffffff;
    color: #5f5f5f;
    cursor: pointer;
    font-size: 8px;
    font-weight: 600;

    &:hover:not(:disabled) {
        border-color: ${PINK};
        background: #fffafb;
        color: ${TEXT};
    }

    &:disabled {
        opacity: 0.45;
        cursor: default;
    }
`;

export const SecondaryButton = styled(ActionButton)`
    border-color: #ead7a7;
    background: #fffdf6;
    color: #8c712c;
`;

export const DeleteButton = styled(ActionButton)`
    color: #a85365;

    &:hover:not(:disabled) {
        border-color: #e7b6c0;
        background: #fff4f6;
        color: #92495a;
    }
`;

export const LoadingBox = styled.div`
    padding: 50px 20px;
    border: 1px solid ${BORDER};
    border-radius: 18px;
    background: #ffffff;
    color: ${MUTED};
    font-size: 10px;
    text-align: center;
`;

export const EmptyState = styled.div`
    padding: 44px 24px;
    border: 1px solid ${BORDER};
    border-radius: 16px;
    background: #ffffff;
    text-align: center;

    strong,
    span {
        display: block;
    }

    strong {
        color: ${TEXT};
        font-size: 12px;
        font-weight: 650;
    }

    span {
        max-width: 520px;
        margin: 6px auto 0;
        color: ${MUTED};
        font-size: 9px;
        line-height: 1.5;
    }
`;

export const ErrorBox = styled.div`
    max-width: 100%;
    margin: 8px 0;
    padding: 9px 11px;
    overflow: hidden;
    border-radius: 9px;
    background: #fff0f2;
    color: #a85365;
    font-size: 8px;
    line-height: 1.45;
    text-overflow: ellipsis;
`;

export const ModalOverlay = styled.div`
    position: fixed;
    z-index: ${({ $higher }) => ($higher ? 1300 : 1200)};
    inset: 0;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(20, 20, 20, 0.3);
    backdrop-filter: blur(3px);

    @media (max-width: 600px) {
        padding: 10px;
    }
`;

export const Modal = styled.div`
    width: min(900px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 22px;
    border: 1px solid ${BORDER};
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.15);
`;

export const ResultModal = styled(Modal)`
    width: min(780px, 100%);
`;

export const ModalTitle = styled.div`
    margin-bottom: 17px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;

    strong,
    span {
        display: block;
    }

    strong {
        color: ${TEXT};
        font-size: 15px;
        font-weight: 650;
    }

    span {
        margin-top: 5px;
        color: ${MUTED};
        font-size: 8px;
    }
`;

export const ModalClose = styled.button`
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border: 0;
    border-radius: 10px;
    background: #f5f5f5;
    color: #777777;
    cursor: pointer;
    font-size: 19px;
`;

export const CompanyList = styled.div`
    overflow: hidden;
    border: 1px solid ${BORDER};
    border-radius: 13px;
`;

export const CompanyLine = styled.div`
    min-height: 62px;
    padding: 11px 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    border-bottom: 1px solid ${BORDER};

    &:last-child {
        border-bottom: 0;
    }

    > div:first-child {
        min-width: 0;
    }

    strong {
        display: block;
        max-width: 470px;
        overflow: hidden;
        color: ${TEXT};
        font-size: 9px;
        font-weight: 650;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    @media (max-width: 650px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

export const CompanyMeta = styled.div`
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    span {
        color: ${MUTED};
        font-size: 8px;
    }
`;

export const CompanyActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
`;

export const CaptchaBadge = styled.span`
    display: inline-flex;
    min-height: 27px;
    padding: 0 8px;
    align-items: center;
    border-radius: 8px;
    background: #fff4df;
    color: #9a7223;
    font-size: 7px;
    font-weight: 700;
`;

export const PaginationActions = styled.div`
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    > span {
        color: ${MUTED};
        font-size: 8px;
    }
`;

export const ResultSection = styled.div`
    display: grid;
    gap: 12px;
`;

export const ResultLink = styled.a`
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    color: ${PINK_DARK};
    font-size: 8px;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
        color: ${TEXT};
    }
`;

export const FormBlock = styled.div`
    padding: 13px;
    border: 1px solid ${BORDER};
    border-radius: 12px;
    background: #ffffff;

    > div:first-child {
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    strong {
        color: ${TEXT};
        font-size: 9px;
        font-weight: 650;
    }

    span {
        color: ${MUTED};
        font-size: 8px;
    }
`;

export const FormFieldList = styled.div`
    margin-top: 10px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;

    > span {
        padding: 5px 7px;
        border-radius: 7px;
        background: #f6f6f6;
        color: #666666;
        font-size: 7px;
    }
`;
