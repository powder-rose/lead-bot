import styled from "styled-components";

import {
    PINK,
    PINK_DARK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";

export const CompaniesToolbar = styled.div`
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    strong {
        display: block;
        color: ${TEXT};
        font-size: 16px;
        font-weight: 600;
    }

    @media (max-width: 1000px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const CompaniesSummary = styled.span`
    display: block;
    margin-top: 4px;
    color: ${MUTED};
    font-size: 10px;
`;

export const ToolbarActions = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 700px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const SearchInput = styled.input`
    width: 300px;
    height: 44px;
    padding: 0 14px;
    border: 1px solid ${BORDER};
    border-radius: 12px;
    outline: none;
    background: #ffffff;
    color: ${TEXT};
    font-size: 11px;

    &::placeholder {
        color: #aaaaaa;
    }

    &:focus {
        border-color: ${PINK};
        box-shadow: 0 0 0 4px rgba(243, 167, 184, 0.12);
    }

    @media (max-width: 700px) {
        width: 100%;
    }
`;

export const AddButton = styled.button`
    height: 44px;
    padding: 0 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 0;
    border-radius: 12px;
    background: ${TEXT};
    color: #ffffff;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;

    span {
        font-size: 17px;
        font-weight: 300;
    }
`;

export const ClearDatabaseButton = styled.button`
    height: 44px;
    padding: 0 15px;
    border: 1px solid #e7b6c0;
    border-radius: 12px;
    background: #fffafb;
    color: #a85365;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;

    &:hover {
        background: #fff0f3;
        border-color: #d995a3;
    }

    &:disabled {
        opacity: 0.45;
        cursor: default;
    }
`;

export const FilterBar = styled.div`
    margin-bottom: 14px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    border: 1px solid ${BORDER};
    border-radius: 14px;
    background: #ffffff;
`;

export const FilterSelect = styled.select`
    max-width: 260px;
    height: 38px;
    padding: 0 32px 0 11px;
    border: 1px solid ${BORDER};
    border-radius: 10px;
    outline: none;
    background: #ffffff;
    color: #666666;
    cursor: pointer;
    font-size: 9px;

    &:focus {
        border-color: ${PINK};
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }

    @media (max-width: 600px) {
        width: 100%;
        max-width: none;
    }
`;

export const ResetFiltersButton = styled.button`
    height: 38px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: #f5f5f5;
    color: #777777;
    cursor: pointer;
    font-size: 9px;
    font-weight: 600;

    &:hover {
        background: #eeeeee;
        color: ${TEXT};
    }
`;

export const CompaniesCard = styled.section`
    overflow: hidden;
    border: 1px solid ${BORDER};
    border-radius: 20px;
    background: #ffffff;
`;

export const TableWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
`;

export const CompaniesTable = styled.table`
    width: 100%;
    border-collapse: collapse;

    th,
    td {
        padding: 15px 18px;
        border-bottom: 1px solid ${BORDER};
        text-align: left;
        vertical-align: middle;
    }

    th {
        background: #fafafa;
        color: ${MUTED};
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        white-space: nowrap;
    }

    td {
        max-width: 320px;
        color: #666666;
        font-size: 11px;
        line-height: 1.45;
    }

    tbody tr:hover {
        background: #fcfcfc;
    }

    tbody tr:last-child td {
        border-bottom: 0;
    }
`;

export const CompanyName = styled.strong`
    display: block;
    max-width: 290px;
    overflow: hidden;
    color: ${TEXT};
    font-size: 11px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const CompanyWebsite = styled.a`
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: ${MUTED};
    font-size: 9px;
    text-decoration: none;

    &:hover {
        color: ${PINK_DARK};
    }
`;

export const StatusBadge = styled.span`
    display: inline-flex;
    padding: 6px 9px;
    border-radius: 8px;
    background: ${({ $status }) => {
        if ($status === "scanned") return "#eef9f2";
        if ($status === "no_form") return "#f3f3f3";
        if ($status === "error") return "#fff0f2";
        return "#fff0f4";
    }};
    color: ${({ $status }) => {
        if ($status === "scanned") return "#278354";
        if ($status === "no_form") return "#777777";
        if ($status === "error") return "#a85365";
        return PINK_DARK;
    }};
    font-size: 9px;
    font-weight: 600;
    white-space: nowrap;
`;

export const ActionsCell = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
`;

export const RowActionButton = styled.button`
    padding: 7px 9px;
    border: 1px solid ${BORDER};
    border-radius: 8px;
    background: #ffffff;
    color: #666666;
    cursor: pointer;
    font-size: 9px;

    &:hover {
        border-color: ${PINK};
        color: ${TEXT};
        background: #fffafb;
    }
`;

export const OpenWebsiteLink = styled.a`
    padding: 7px 9px;
    border: 1px solid ${BORDER};
    border-radius: 8px;
    color: #666666;
    font-size: 9px;
    text-decoration: none;

    &:hover {
        border-color: ${PINK};
        color: ${PINK_DARK};
    }
`;

export const DeleteButton = styled(RowActionButton)`
    color: #a85365;

    &:hover {
        border-color: #eab9c2;
        background: #fff4f6;
        color: #96475a;
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
`;

export const EmptyCompanies = styled.div`
    padding: 50px 30px;
    text-align: center;

    strong,
    span {
        display: block;
    }

    strong {
        color: ${TEXT};
        font-size: 13px;
        font-weight: 600;
    }

    span {
        margin-top: 5px;
        color: ${MUTED};
        font-size: 10px;
    }
`;

export const LoadingMessage = styled.div`
    padding: 50px;
    color: ${MUTED};
    font-size: 11px;
    text-align: center;
`;

export const ErrorMessage = styled.div`
    margin-bottom: 14px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #fff0f2;
    color: #a85365;
    font-size: 11px;
`;

export const Pagination = styled.div`
    margin-top: 14px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border: 1px solid ${BORDER};
    border-radius: 14px;
    background: #ffffff;

    @media (max-width: 700px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

export const PaginationInfo = styled.div`
    color: ${MUTED};
    font-size: 9px;

    strong {
        color: ${TEXT};
        font-weight: 600;
    }
`;

export const PaginationControls = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
`;

export const PageButton = styled.button`
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    display: grid;
    place-items: center;
    border: 1px solid
        ${({ $active }) =>
            $active ? TEXT : BORDER};
    border-radius: 9px;
    background:
        ${({ $active }) =>
            $active ? TEXT : "#ffffff"};
    color:
        ${({ $active }) =>
            $active ? "#ffffff" : "#666666"};
    cursor: pointer;
    font-size: 9px;
    font-weight: 600;

    &:disabled {
        opacity: 0.35;
        cursor: default;
    }
`;

export const PaginationDots = styled.span`
    min-width: 24px;
    color: ${MUTED};
    font-size: 11px;
    text-align: center;
`;

export const ModalOverlay = styled.div`
    position: fixed;
    z-index: 1000;
    inset: 0;
    padding: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(20, 20, 20, 0.28);
    backdrop-filter: blur(3px);
`;

export const ModalCard = styled.div`
    width: min(620px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 26px;
    border: 1px solid ${BORDER};
    border-radius: 22px;
    background: #ffffff;
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.14);
`;

export const ModalHeader = styled.div`
    margin-bottom: 24px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
`;

export const ModalTitle = styled.h2`
    margin: 0;
    color: ${TEXT};
    font-size: 22px;
    font-weight: 650;
`;

export const ModalSubtitle = styled.p`
    margin: 7px 0 0;
    color: ${MUTED};
    font-size: 10px;
    line-height: 1.5;
`;

export const ModalClose = styled.button`
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 10px;
    background: #f6f6f6;
    color: #777777;
    cursor: pointer;
    font-size: 20px;
`;

export const FormGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(
        2,
        minmax(0, 1fr)
    );
    gap: 12px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

export const FormField = styled.label`
    margin-bottom: 14px;
    display: block;
`;

export const FormLabel = styled.span`
    margin-bottom: 7px;
    display: block;
    color: #666666;
    font-size: 10px;
    font-weight: 600;
`;

export const FormInput = styled.input`
    width: 100%;
    height: 44px;
    padding: 0 13px;
    border: 1px solid ${BORDER};
    border-radius: 11px;
    outline: none;
    background: #ffffff;
    color: ${TEXT};
    font-size: 11px;

    &:focus {
        border-color: ${PINK};
        box-shadow: 0 0 0 4px rgba(243, 167, 184, 0.12);
    }
`;

export const ModalError = styled.div`
    margin-top: 4px;
    padding: 11px 13px;
    border-radius: 10px;
    background: #fff0f2;
    color: #a85365;
    font-size: 10px;
`;

export const ModalActions = styled.div`
    margin-top: 24px;
    padding-top: 18px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid ${BORDER};
`;

export const CancelButton = styled.button`
    min-width: 90px;
    height: 42px;
    padding: 0 14px;
    border: 1px solid ${BORDER};
    border-radius: 11px;
    background: #ffffff;
    color: #666666;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;
`;

export const SaveButton = styled.button`
    min-width: 110px;
    height: 42px;
    padding: 0 16px;
    border: 0;
    border-radius: 11px;
    background: ${TEXT};
    color: #ffffff;
    cursor: pointer;
    font-size: 10px;
    font-weight: 600;

    &:disabled {
        opacity: 0.5;
        cursor: default;
    }
`;


export const CheckboxCell = styled.td`
    width: 44px;
    min-width: 44px;
    padding-left: 14px !important;
    padding-right: 6px !important;
`;

export const RowCheckbox = styled.input`
    width: 15px;
    height: 15px;
    margin: 0;
    cursor: pointer;
    accent-color: ${PINK_DARK};
`;

export const SelectionBar = styled.div`
    margin-bottom: 14px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 1px solid #efd9df;
    border-radius: 13px;
    background: #fffafb;

    @media (max-width: 760px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const SelectionInfo = styled.div`
    color: ${TEXT};
    font-size: 10px;
    font-weight: 600;
`;

export const SelectionActions = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

export const BulkActionButton = styled.button`
    height: 34px;
    padding: 0 10px;
    border: 1px solid ${BORDER};
    border-radius: 9px;
    background: #ffffff;
    color: #666666;
    cursor: pointer;
    font-size: 8px;
    font-weight: 600;
`;

export const SelectAllButton = styled(BulkActionButton)`
    border-color: #ecc8d1;
    color: ${PINK_DARK};
`;

export const CreateCampaignButton = styled.button`
    height: 34px;
    padding: 0 12px;
    border: 0;
    border-radius: 9px;
    background: ${TEXT};
    color: #ffffff;
    cursor: pointer;
    font-size: 8px;
    font-weight: 650;
`;
