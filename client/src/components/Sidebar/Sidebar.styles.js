import styled from "styled-components";

import {
    NavLink,
} from "react-router-dom";

import {
    PINK,
    TEXT,
    MUTED,
    BORDER,
} from "../../styles/theme.js";


export const Sidebar = styled.aside`
    position: sticky;
    top: 0;

    height: 100vh;
    padding: 24px 16px;

    display: flex;
    flex-direction: column;
    justify-content: space-between;

    background: #ffffff;
    border-right: 1px solid ${BORDER};

    @media (max-width: 900px) {
        display: none;
    }
`;

export const Brand = styled.div`
    padding: 0 10px 28px;

    display: flex;
    align-items: center;
    gap: 12px;
`;

export const BrandMark = styled.div`
    width: 40px;
    height: 40px;

    display: grid;
    place-items: center;

    border-radius: 12px;

    background: ${PINK};
    color: #ffffff;

    font-size: 13px;
    font-weight: 700;
`;

export const BrandText = styled.div`
    display: flex;
    flex-direction: column;

    strong {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.3px;
    }

    span {
        margin-top: 2px;

        color: ${MUTED};

        font-size: 10px;
        font-weight: 500;
    }
`;

export const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const NavItem = styled(NavLink)`
    min-height: 44px;

    padding: 0 12px;

    display: flex;
    align-items: center;
    gap: 10px;

    border-radius: 12px;

    background: transparent;
    color: #777777;

    font-size: 13px;
    font-weight: 500;

    text-decoration: none;

    transition:
        background 0.15s,
        color 0.15s;

    &:hover {
        background: #f7f7f7;
        color: ${TEXT};
    }

    &.active {
        background: #f4f4f4;
        color: ${TEXT};
        font-weight: 600;
    }
`;

export const NavDot = styled.i`
    width: 7px;
    height: 7px;

    flex: 0 0 auto;

    border-radius: 50%;

    background: ${PINK};
`;

export const SidebarFooter = styled.div`
    padding: 18px 10px 4px;

    border-top: 1px solid ${BORDER};

    div {
        display: flex;
        justify-content: space-between;
    }

    span,
    strong {
        font-size: 10px;
    }

    span {
        color: ${MUTED};
        font-weight: 400;
    }

    strong {
        color: #666666;
        font-weight: 500;
    }
`;
