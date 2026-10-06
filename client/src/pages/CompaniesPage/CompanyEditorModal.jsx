import { useEffect, useState } from 'react';

import {
  CancelButton,
  FormField,
  FormGrid,
  FormInput,
  FormLabel,
  ModalActions,
  ModalCard,
  ModalClose,
  ModalError,
  ModalHeader,
  ModalOverlay,
  ModalSubtitle,
  ModalTitle,
  SaveButton,
} from './CompaniesPage.styles';

const EMPTY_FORM = {
  name: '',
  website: '',
  phone: '',
  city: '',
  region: '',
  category: '',
};

function getInitialForm(company) {
  if (!company) return EMPTY_FORM;

  return {
    name: company.name || '',
    website: company.website || '',
    phone: company.phone || '',
    city: company.city || '',
    region: company.region || '',
    category: company.category || '',
  };
}

export function CompanyEditorModal({ company, open, onClose, onSave }) {
  const [form, setForm] = useState(() => getInitialForm(company));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(getInitialForm(company));
    setError(null);
  }, [company, open]);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm(current => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Введите название компании');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(company, form);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Не удалось сохранить компанию');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <ModalOverlay
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <ModalCard>
        <ModalHeader>
          <div>
            <ModalTitle>{company ? 'Изменить компанию' : 'Добавить компанию'}</ModalTitle>
            <ModalSubtitle>
              {company
                ? 'Измените данные и сохраните изменения'
                : 'Добавьте компанию в базу LeadBot'}
            </ModalSubtitle>
          </div>

          <ModalClose type="button" onClick={handleClose} disabled={saving}>
            ×
          </ModalClose>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <FormField>
            <FormLabel>Название компании *</FormLabel>
            <FormInput
              autoFocus
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="ООО Компания"
            />
          </FormField>

          <FormField>
            <FormLabel>Сайт</FormLabel>
            <FormInput
              name="website"
              value={form.website}
              onChange={handleFormChange}
              placeholder="company.ru"
            />
          </FormField>

          <FormGrid>
            <FormField>
              <FormLabel>Телефон</FormLabel>
              <FormInput
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="+7 999 000-00-00"
              />
            </FormField>

            <FormField>
              <FormLabel>Город</FormLabel>
              <FormInput
                name="city"
                value={form.city}
                onChange={handleFormChange}
                placeholder="Москва"
              />
            </FormField>
          </FormGrid>

          <FormGrid>
            <FormField>
              <FormLabel>Регион</FormLabel>
              <FormInput
                name="region"
                value={form.region}
                onChange={handleFormChange}
                placeholder="Москва"
              />
            </FormField>

            <FormField>
              <FormLabel>Категория</FormLabel>
              <FormInput
                name="category"
                value={form.category}
                onChange={handleFormChange}
                placeholder="Пожарная безопасность"
              />
            </FormField>
          </FormGrid>

          {error && <ModalError>{error}</ModalError>}

          <ModalActions>
            <CancelButton type="button" onClick={handleClose} disabled={saving}>
              Отмена
            </CancelButton>

            <SaveButton type="submit" disabled={saving}>
              {saving ? 'Сохраняем...' : company ? 'Сохранить' : 'Добавить'}
            </SaveButton>
          </ModalActions>
        </form>
      </ModalCard>
    </ModalOverlay>
  );
}
