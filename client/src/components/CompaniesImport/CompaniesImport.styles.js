import styled from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";


export const ImportButton =
    styled.button`
        height: 44px;
        padding: 0 16px;

        border: 1px solid
            ${BORDER};

        border-radius: 12px;

        background: #ffffff;
        color: ${TEXT};

        cursor: pointer;

        font-size: 10px;
        font-weight: 600;

        white-space: nowrap;

        &:hover {
            border-color:
                ${PINK};
        }

        &:disabled {
            opacity: 0.5;
            cursor: default;
        }
    `;


export const HiddenFileInput =
    styled.input`
        display: none;
    `;


export const ImportOverlay =
    styled.div`
        position: fixed;
        z-index: 1100;

        inset: 0;

        padding: 30px;

        display: flex;
        align-items: center;
        justify-content: center;

        background:
            rgba(
                20,
                20,
                20,
                0.3
            );

        backdrop-filter:
            blur(3px);

        @media (max-width: 600px) {
            padding: 12px;
        }
    `;


export const ImportModal =
    styled.div`
        width: min(
            980px,
            100%
        );

        max-height:
            calc(
                100vh - 50px
            );

        overflow-y: auto;

        padding: 26px;

        border: 1px solid
            ${BORDER};

        border-radius: 22px;

        background: #ffffff;

        box-shadow:
            0 30px 90px
            rgba(
                0,
                0,
                0,
                0.15
            );

        @media (max-width: 600px) {
            padding: 18px;
        }
    `;


export const ImportHeader =
    styled.div`
        margin-bottom: 22px;

        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
    `;


export const ImportTitle =
    styled.h2`
        margin: 0;

        color: ${TEXT};

        font-size: 22px;
        font-weight: 650;

        letter-spacing: -0.5px;
    `;


export const ImportSubtitle =
    styled.p`
        margin: 14px 0 8px;

        color: ${MUTED};

        font-size: 10px;
        line-height: 1.5;
    `;


export const CloseButton =
    styled.button`
        width: 34px;
        height: 34px;

        flex: 0 0 auto;

        border: 0;
        border-radius: 10px;

        background: #f5f5f5;
        color: #777777;

        cursor: pointer;

        font-size: 20px;

        &:disabled {
            opacity: 0.45;
            cursor: default;
        }
    `;


export const FileInfo =
    styled.div`
        margin-bottom: 18px;
        padding: 13px 15px;

        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;

        border-radius: 12px;

        background: #f8f8f8;

        strong {
            color: ${TEXT};
            font-size: 11px;
        }

        span {
            color: ${MUTED};
            font-size: 9px;
        }
    `;


export const StatsGrid =
    styled.div`
        margin-bottom: 20px;

        display: grid;
        grid-template-columns:
            repeat(
                auto-fit,
                minmax(
                    150px,
                    1fr
                )
            );

        gap: 10px;
    `;


export const StatCard =
    styled.div`
        padding: 15px;

        border: 1px solid
            ${BORDER};

        border-radius: 12px;

        background: #ffffff;
    `;


export const StatValue =
    styled.strong`
        display: block;

        color: ${TEXT};

        font-size: 18px;
        font-weight: 650;
    `;


export const StatLabel =
    styled.span`
        display: block;

        margin-top: 4px;

        color: ${MUTED};

        font-size: 9px;
        line-height: 1.4;
    `;


export const PreviewTableWrapper =
    styled.div`
        overflow-x: auto;

        border: 1px solid
            ${BORDER};

        border-radius: 14px;
    `;


export const PreviewTable =
    styled.table`
        width: 100%;

        border-collapse: collapse;

        th,
        td {
            padding: 11px 13px;

            border-bottom:
                1px solid
                ${BORDER};

            text-align: left;
            vertical-align: top;
        }

        th {
            background: #fafafa;

            color: ${MUTED};

            font-size: 8px;
            font-weight: 600;

            text-transform: uppercase;
        }

        td {
            max-width: 300px;

            color: #666666;

            font-size: 9px;
            line-height: 1.5;
        }

        strong {
            color: ${TEXT};
            font-weight: 600;
        }

        tbody tr:last-child
            td {
            border-bottom: 0;
        }
    `;


export const ImportError =
    styled.div`
        margin-top: 14px;
        padding: 10px 13px;

        border-radius: 10px;

        background: #fff0f2;
        color: #a85365;

        font-size: 10px;
    `;


export const RubricsHeader =
    styled.div`
        margin-bottom: 14px;

        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;

        strong {
            display: block;

            color: ${TEXT};

            font-size: 11px;
            font-weight: 600;
        }

        @media (max-width: 700px) {
            align-items: stretch;
            flex-direction: column;
        }
    `;


export const SelectedInfo =
    styled.span`
        display: block;

        margin-top: 5px;

        color: ${PINK_DARK};

        font-size: 9px;
        font-weight: 600;
    `;


export const RubricsSearch =
    styled.input`
        width: min(
            370px,
            100%
        );

        height: 42px;

        padding: 0 13px;

        border: 1px solid
            ${BORDER};

        border-radius: 11px;

        outline: none;

        background: #ffffff;
        color: ${TEXT};

        font-size: 10px;

        &:focus {
            border-color:
                ${PINK};

            box-shadow:
                0 0 0 4px
                rgba(
                    243,
                    167,
                    184,
                    0.12
                );
        }
    `;


export const RubricsColumns =
    styled.div`
        display: grid;
        grid-template-columns:
            repeat(
                2,
                minmax(
                    0,
                    1fr
                )
            );

        gap: 12px;

        @media (max-width: 760px) {
            grid-template-columns:
                1fr;
        }
    `;


export const RubricsSection =
    styled.section`
        min-width: 0;

        border: 1px solid
            ${BORDER};

        border-radius: 14px;

        overflow: hidden;

        h3 {
            margin: 0;
            padding: 12px 14px;

            border-bottom:
                1px solid
                ${BORDER};

            background: #fafafa;

            color: ${TEXT};

            font-size: 10px;
            font-weight: 650;
        }
    `;


export const RubricList =
    styled.div`
        max-height: 430px;

        overflow-y: auto;
    `;


export const RubricItem =
    styled.label`
        min-height: 42px;

        padding: 9px 12px;

        display: grid;
        grid-template-columns:
            auto
            minmax(
                0,
                1fr
            )
            auto;

        align-items: center;
        gap: 9px;

        border-bottom:
            1px solid
            ${BORDER};

        cursor: pointer;

        color: #555555;

        font-size: 9px;
        line-height: 1.35;

        &:last-child {
            border-bottom: 0;
        }

        &:hover {
            background: #fffafb;
        }
    `;


export const RubricCheckbox =
    styled.input`
        width: 14px;
        height: 14px;

        accent-color:
            ${PINK_DARK};
    `;


export const RubricCount =
    styled.span`
        color: ${MUTED};

        font-size: 8px;

        white-space: nowrap;
    `;


export const ModalActions =
    styled.div`
        margin-top: 20px;

        display: flex;
        justify-content: flex-end;
        gap: 8px;
    `;


export const CancelButton =
    styled.button`
        height: 42px;
        padding: 0 16px;

        border: 1px solid
            ${BORDER};

        border-radius: 11px;

        background: #ffffff;

        cursor: pointer;

        font-size: 10px;
        font-weight: 600;

        &:disabled {
            opacity: 0.5;
            cursor: default;
        }
    `;


export const ContinueButton =
    styled.button`
        height: 42px;
        padding: 0 18px;

        border: 0;
        border-radius: 11px;

        background: ${TEXT};
        color: #ffffff;

        cursor: pointer;

        font-size: 10px;
        font-weight: 600;

        &:disabled {
            opacity: 0.35;
            cursor: default;
        }
    `;
