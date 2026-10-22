const currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export const formatPrice = (value) => currency.format(Number(value));

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_POLICY =
  "Minimo 8 caracteres, con mayuscula, minuscula, digito y simbolo.";

export const isValidPassword = (value) => PASSWORD_PATTERN.test(value);
