import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { queriesList } from "../tables/queries";

export interface QueriesPanelState {
  components: OBC.Components;
}

export const queriesPanelTemplate: BUI.StatefullComponent<QueriesPanelState> = (state) => {
  const { components } = state;

  const [modelsList] = queriesList({ components });

  // 🔍 Search handler (ya lo tienes)
  const onSearch = (e: Event) => {
    const input = e.target as BUI.TextInput;
    modelsList.queryString = input.value;
  };

  // =====================================================
  // ✅ HELPERS
  // =====================================================
  const emitQueriesChanged = () => {
    window.dispatchEvent(new CustomEvent("bimapp:queries-changed"));
  };

  // Convierte texto a boolean/number/string
  const parseValue = (raw: string): string | number | boolean | RegExp => {
    const v = raw.trim();

    // Permitir regex si el usuario escribe: /algo/
    if (v.startsWith("/") && v.endsWith("/") && v.length > 2) {
      return new RegExp(v.slice(1, -1));
    }

    if (v.toLowerCase() === "true") return true;
    if (v.toLowerCase() === "false") return false;

    // number si aplica
    const num = Number(v);
    if (!Number.isNaN(num) && v !== "") return num;

    return v; // string
  };

  // =====================================================
  // ✅ CREATE QUERY (Pset / Prop / Value)
  // =====================================================
  let nameInput: BUI.TextInput | null = null;
  let psetInput: BUI.TextInput | null = null;
  let propInput: BUI.TextInput | null = null;
  let valueInput: BUI.TextInput | null = null;

  const onNameCreated = (e?: Element) => { if (e) nameInput = e as BUI.TextInput; };
  const onPsetCreated = (e?: Element) => { if (e) psetInput = e as BUI.TextInput; };
  const onPropCreated = (e?: Element) => { if (e) propInput = e as BUI.TextInput; };
  const onValueCreated = (e?: Element) => { if (e) valueInput = e as BUI.TextInput; };

  const onCreateQuery = () => {
    if (!nameInput || !psetInput || !propInput || !valueInput) return;

    const qName = nameInput.value.trim();
    const pset = psetInput.value.trim();
    const prop = propInput.value.trim();
    const rawValue = valueInput.value.trim();

    if (!qName || !pset || !prop || !rawValue) return;

    const finder = components.get(OBC.ItemsFinder);

    // Value tipado (string/number/boolean/regex)
    const parsed = parseValue(rawValue);

    // 🔥 Query:
    // Item --IsDefinedBy--> PropertySet(Name == pset)
    //          --HasProperties--> Property(Name == prop && NominalValue == value)
    finder.create(qName, [
      {
        relation: {
          name: "IsDefinedBy",
          query: {
            attributes: {
              queries: [
                { name: /Name/, value: new RegExp(pset, "i") }, // Pset name
              ],
            },
            relation: {
              name: "HasProperties",
              query: {
                attributes: {
                  queries: [
                    { name: /Name/, value: new RegExp(prop, "i") }, // Property name
                    { name: /NominalValue/, value: parsed },        // Property value
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    emitQueriesChanged();

    // opcional: limpiar inputs
    // nameInput.value = "";
    // psetInput.value = "";
    // propInput.value = "";
    // valueInput.value = "";
  };

  // =====================================================
  // ✅ DOWNLOAD / UPLOAD (ItemsFinder export/import)
  // =====================================================
  let uploadInput: HTMLInputElement | null = null;

  const onUploadInputCreated = (e?: Element) => {
    if (!e) return;
    uploadInput = e as HTMLInputElement;
  };

  const onDownloadQueries = () => {
    const itemsFinder = components.get(OBC.ItemsFinder);
    const exported = itemsFinder.export();

    const json = JSON.stringify(exported, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "items-finder-queries.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  const onOpenUpload = () => {
    uploadInput?.click();
  };

  const onUploadQueriesFile = async () => {
    if (!uploadInput?.files?.length) return;

    const file = uploadInput.files[0];
    const text = await file.text();

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON file", err);
      return;
    }

    const itemsFinder = components.get(OBC.ItemsFinder);
    itemsFinder.import(parsed);

    uploadInput.value = "";
    emitQueriesChanged();
  };

  // =====================================================

  return BUI.html`
    <bim-panel-section fixed label="Queries List">

      <!-- 🔍 Search -->
      <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
        <bim-text-input
          @input=${onSearch}
          placeholder="Search..."
          debounce="200"
        ></bim-text-input>

        <bim-button label="Download" icon="download" @click=${onDownloadQueries}></bim-button>
        <bim-button label="Upload" icon="upload" @click=${onOpenUpload}></bim-button>

        <input
          type="file"
          accept="application/json"
          style="display:none"
          ${BUI.ref(onUploadInputCreated)}
          @change=${onUploadQueriesFile}
        />
      </div>

      <!-- ✅ Create query por Pset/Prop/Value -->
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem;">
        <bim-text-input ${BUI.ref(onNameCreated)} placeholder="Query name"></bim-text-input>
        <bim-text-input ${BUI.ref(onPsetCreated)} placeholder="Pset (ej: OTACC_00_Generales)"></bim-text-input>
        <bim-text-input ${BUI.ref(onPropCreated)} placeholder="Prop (ej: OTACC_00_Codigo_Archivo)"></bim-text-input>
        <bim-text-input ${BUI.ref(onValueCreated)} placeholder="Value (ej: GWE-COP-TI1-ID-CIV-PL-005)"></bim-text-input>

        <bim-button label="Create" icon="add" @click=${onCreateQuery}></bim-button>
      </div>

      <!-- 📋 tabla existente -->
      ${modelsList}
    </bim-panel-section>
  `;
};
