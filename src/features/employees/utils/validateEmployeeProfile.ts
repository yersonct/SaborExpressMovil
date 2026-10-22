export interface EmployeeProfileErrors {
  name?: string;
  lastName?: string;
  phone?: string;
}

export function validateEmployeeProfile(
  name: string,
  lastName: string,
  phone: string,
): EmployeeProfileErrors {
  const errors: EmployeeProfileErrors = {};
  const normalizedName = name.trim();
  const normalizedLastName = lastName.trim();
  const normalizedPhone = phone.trim();

  if (!normalizedName) {
    errors.name = "El nombre es obligatorio.";
  } else if (normalizedName.length < 3) {
    errors.name = "El nombre debe tener al menos 3 caracteres.";
  } else if (/\d/.test(normalizedName)) {
    errors.name = "El nombre no puede contener números.";
  }

  if (normalizedLastName && /\d/.test(normalizedLastName)) {
    errors.lastName = "El apellido no puede contener números.";
  }

  if (normalizedPhone && !/^\d{7}(?:\d{3})?$/.test(normalizedPhone)) {
    errors.phone =
      "El teléfono debe tener 7 dígitos (fijo) o 10 dígitos (celular), sin espacios ni guiones.";
  }

  return errors;
}
