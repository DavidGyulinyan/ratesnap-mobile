import React from "react";
import { TextInput, type TextInputProps } from "react-native";

export type AppTextInputProps = TextInputProps;

/**
 * TextInput with copy/paste/select enabled on mobile (native context menu).
 */
export function AppTextInput({
  contextMenuHidden = false,
  ...props
}: AppTextInputProps) {
  return <TextInput contextMenuHidden={contextMenuHidden} {...props} />;
}

export type CopyableDisplayFieldProps = Omit<
  TextInputProps,
  "editable" | "onChangeText" | "value"
> & {
  value: string;
};

/**
 * Read-only value users can long-press to select and copy (e.g. conversion results).
 */
export function CopyableDisplayField({
  contextMenuHidden = false,
  editable = false,
  showSoftInputOnFocus = false,
  value,
  ...props
}: CopyableDisplayFieldProps) {
  return (
    <TextInput
      contextMenuHidden={contextMenuHidden}
      editable={editable}
      showSoftInputOnFocus={showSoftInputOnFocus}
      value={value}
      {...props}
    />
  );
}
