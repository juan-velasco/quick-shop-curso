import { Link } from "react-router-dom";
import { buttonClasses } from "./buttonStyles.js";

export default function LinkButton({ variant = "primary", className = "", ...props }) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
