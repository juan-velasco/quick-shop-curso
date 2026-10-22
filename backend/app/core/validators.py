import re

PASSWORD_POLICY = (
    "La password debe tener al menos 8 caracteres, una mayuscula, una minuscula, "
    "un digito y un simbolo"
)


def validate_password_policy(value: str) -> str:
    if (
        len(value) < 8
        or not re.search(r"[A-Z]", value)
        or not re.search(r"[a-z]", value)
        or not re.search(r"\d", value)
        or not re.search(r"[^A-Za-z0-9]", value)
    ):
        raise ValueError(PASSWORD_POLICY)
    return value
