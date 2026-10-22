import { buttonClasses } from "./buttonStyles.js";

export default function Button({ variant = "primary", className = "", ...props }) {
  return <button type="button" className={buttonClasses(variant, className)} {...props} />;
}
