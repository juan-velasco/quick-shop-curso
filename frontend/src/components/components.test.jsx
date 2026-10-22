import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { product } from "../test/utils.jsx";
import Button from "./Button.jsx";
import FormField from "./FormField.jsx";
import LinkButton from "./LinkButton.jsx";
import Notice from "./Notice.jsx";
import ProductCard from "./ProductCard.jsx";
import StateMessage from "./StateMessage.jsx";
import Tag from "./Tag.jsx";

const withRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("Button", () => {
  it.each(["primary", "secondary", "aloe", "danger"])("la variante %s es pill y de 44 px", (variant) => {
    render(<Button variant={variant}>Accion</Button>);
    const button = screen.getByRole("button", { name: "Accion" });
    expect(button).toHaveClass("rounded-pill", "min-h-control");
    expect(button).not.toHaveClass("rounded", "rounded-md", "rounded-lg");
  });

  it("primary es negro con texto blanco y pulsado gris", () => {
    render(<Button>Ok</Button>);
    const button = screen.getByRole("button", { name: "Ok" });
    expect(button).toHaveClass("bg-ink", "text-on-ink", "enabled:active:bg-pressed");
  });

  it("deshabilitado expone el estado y no es activable", () => {
    render(<Button disabled>Agregar</Button>);
    const button = screen.getByRole("button", { name: "Agregar" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
  });

  it("LinkButton es un enlace con forma pill", () => {
    withRouter(<LinkButton to="/x">Ir</LinkButton>);
    expect(screen.getByRole("link", { name: "Ir" })).toHaveClass("rounded-pill", "bg-ink");
  });
});

describe("Tag y Notice", () => {
  it("Tag es pill y lleva texto", () => {
    render(<Tag variant="mint">Activo</Tag>);
    expect(screen.getByText("Activo")).toHaveClass("rounded-pill", "bg-aloe");
  });

  it("Notice se anuncia como status con relleno aloe", () => {
    render(<Notice>Password actualizada.</Notice>);
    expect(screen.getByRole("status")).toHaveClass("bg-aloe", "text-ink");
  });

  it("StateMessage conserva roles", () => {
    render(
      <>
        <StateMessage kind="error">Fallo</StateMessage>
        <StateMessage kind="loading">Cargando</StateMessage>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo");
    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
  });
});

describe("FormField", () => {
  it("asocia etiqueta, ayuda y error", () => {
    const { rerender } = render(<FormField id="email" label="Email" hint="Tu correo" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-describedby", "email-hint");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveClass("min-h-control", "rounded-md", "border-control");

    rerender(<FormField id="email" label="Email" hint="Tu correo" error="Obligatorio" />);
    const invalid = screen.getByLabelText("Email");
    expect(invalid).toHaveAttribute("aria-invalid", "true");
    expect(invalid).toHaveAttribute("aria-describedby", "email-error");
    expect(invalid).toHaveClass("border-danger");
    expect(screen.getByText("Obligatorio")).toBeInTheDocument();
  });
});

describe("ProductCard", () => {
  it("muestra la etiqueta de texto Agotado y deshabilita el boton", () => {
    withRouter(<ProductCard product={product({ stock: 0 })} />);
    expect(screen.getByText("Agotado")).toHaveClass("rounded-pill");
    expect(screen.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
  });

  it("usa tarjeta blanca con radio y sombra del sistema", () => {
    withRouter(<ProductCard product={product()} />);
    expect(screen.getByRole("article")).toHaveClass("bg-surface", "rounded-lg", "shadow-card");
    expect(screen.getByText("Stock: 5")).toBeInTheDocument();
  });
});
