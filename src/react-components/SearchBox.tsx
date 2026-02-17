import * as React from "react";

interface Props {
  onChange: (value: string) => void;
  placeholder?: string;
  width?: string; // ejemplo: "100%", "40%", "320px"
}

export function SearchBox(props: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        columnGap: 10,
        width: props.width ?? "40%",
      }}
    >
      <bim-text-input
        debounce="200"
        oninput={(e: any) => {
          // bim-text-input es un Web Component, así que tipamos el evento como any
          props.onChange((e.target as any).value as string);
        }}
        placeholder={props.placeholder ?? "Search..."}
      ></bim-text-input>
    </div>
  );
}
