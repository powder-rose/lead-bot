import styled from 'styled-components';
import { BORDER, TEXT } from '../../styles/theme.js';

export const LoginScreen = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
`;

export const LoginCard = styled.section`
  width: min(100%, 420px);
  padding: 32px;
  border: 1px solid ${BORDER};
  border-radius: 20px;
  background: white;
  h1 {
    margin: 0 0 12px;
  }
  p {
    color: #666;
    line-height: 1.5;
  }
  form {
    display: grid;
    gap: 16px;
  }
  label {
    display: grid;
    gap: 8px;
  }
  input {
    width: 100%;
    min-width: 0;
    padding: 12px;
    border: 1px solid #aaa;
    border-radius: 8px;
  }
  input:focus-visible {
    outline: 2px solid ${TEXT};
    outline-offset: 3px;
  }
`;

export const SessionButton = styled.button`
  padding: 10px 16px;
  min-height: 44px;
  border: 1px solid ${TEXT};
  border-radius: 10px;
  background: ${TEXT};
  color: white;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  &:focus-visible {
    outline: 2px solid ${TEXT};
    outline-offset: 3px;
  }
`;

export const SessionError = styled.p`
  color: #a02035 !important;
  font-size: 14px;
`;

export const SessionActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
`;
