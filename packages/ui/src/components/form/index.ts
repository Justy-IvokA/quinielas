export { ColorPicker } from "./color-picker";
export type { ColorPickerProps } from "./color-picker";

export { DatePicker } from "./date-picker";
export type { DatePickerProps } from "./date-picker";

// Export legacy Form component with a different name to avoid conflicts
export { Form as LegacyForm } from "./form";
export type { FormProps as LegacyFormProps } from "./form";

export { FormField as LegacyFormField } from "./form-field";
export type { FormFieldProps as LegacyFormFieldProps } from "./form-field";

export { SelectField } from "./select-field";
export type { SelectFieldProps, SelectFieldOption } from "./select-field";

export { Slider } from "./slider";

// shadcn/ui compatible form components (default exports)
export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField
} from "./form-components";
