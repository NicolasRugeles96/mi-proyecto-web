import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import { QueriesListState, QueriesListTableData } from "./types";

export const queriesListTemplate: BUI.StatefullComponent<QueriesListState> = (state) => {
  const { components } = state;
  const finder = components.get(OBC.ItemsFinder);

  const onCreated = (e?: Element) => {
    if (!e) return;
    const table = e as BUI.Table<QueriesListTableData>;

    const fillData = () => {
      const data: typeof table.data = [];
      for (const [name] of finder.list) {
        data.push({
          data: { Name: name, Actions: "" },
        });
      }
      table.data = data;
    };

    // 1) carga inicial
    fillData();

    // 2) refresco cuando alguien cree / importe / borre queries
    window.addEventListener("bimapp:queries-changed", fillData);
  };

  return BUI.html`
    <bim-table ${BUI.ref(onCreated)}></bim-table>
  `;
};
