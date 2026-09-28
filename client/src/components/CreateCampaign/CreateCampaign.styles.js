import styled from "styled-components";
import { BORDER, MUTED, PINK, TEXT } from "../../styles/theme.js";

export const Overlay = styled.div`
    position: fixed;
    z-index: 1200;
    inset: 0;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(20, 20, 20, 0.32);
    backdrop-filter: blur(3px);
`;

export const Modal = styled.div`
    width: min(650px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 26px;
    border: 1px solid ${BORDER};
    border-radius: 22px;
    background: #ffffff;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.16);
`;

export const Top = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 18px;
`;

export const Title = styled.h2`
    margin: 0;
    color: ${TEXT};
    font-size: 22px;
    font-weight: 650;
`;

export const Subtitle = styled.p`
    max-width: 500px;
    margin: 7px 0 0;
    color: ${MUTED};
    font-size: 10px;
    line-height: 1.5;
`;

export const CloseButton = styled.button`
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 10px;
    background: #f5f5f5;
    color: #777777;
    cursor: pointer;
    font-size: 20px;
`;

export const Counter = styled.div`
    margin-bottom: 18px;
    padding: 12px 14px;
    border-radius: 11px;
    background: #fff7f9;
    color: #777777;
    font-size: 10px;

    strong {
        color: ${TEXT};
        font-size: 12px;
    }
`;

export const Form = styled.form`
    display: grid;
    gap: 13px;
`;

export const Field = styled.label`
    display: block;

    > span {
        display: block;
        margin-bottom: 6px;
        color: #666666;
        font-size: 10px;
        font-weight: 600;
    }

    > small {
        display: block;
        margin-top: 5px;
        color: ${MUTED};
        font-size: 8px;
        text-align: right;
    }
`;

export const Input = styled.input`
    width: 100%;
    height: 44px;
    padding: 0 13px;
    border: 1px solid ${BORDER};
    border-radius: 11px;
    outline: none;
    color: ${TEXT};
    background: #ffffff;
    font-size: 11px;

    &:focus {
        border-color: ${PINK};
        box-shadow: 0 0 0 4px rgba(243, 167, 184, 0.12);
    }
`;

export const Textarea = styled.textarea`
    width: 100%;
    min-height: 150px;
    padding: 12px 13px;
    resize: vertical;
    border: 1px solid ${BORDER};
    border-radius: 11px;
    outline: none;
    color: ${TEXT};
    background: #ffffff;
    font-size: 11px;
    line-height: 1.55;

    &:focus {
        border-color: ${PINK};
        box-shadow: 0 0 0 4px rgba(243, 167, 184, 0.12);
    }
`;

export const ErrorBox = styled.div`
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff0f2;
    color: #a85365;
    font-size: 10px;
`;

export const Actions = styled.div`
    margin-top: 4px;
    padding-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid ${BORDER};
`;

export const CancelButton = styled.button`
    height: 42px;
    padding: 0 15px;
    border: 1px solid ${BORDER};
    border-radius: 11px;
    background: #ffffff;
    color: #666666;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
`;

export const SaveButton = styled.button`
    height: 42px;
    padding: 0 17px;
    border: 0;
    border-radius: 11px;
    background: ${TEXT};
    color: #ffffff;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;

    &:disabled {
        opacity: 0.45;
        cursor: default;
    }
`;
