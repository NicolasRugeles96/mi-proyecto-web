import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { appIcons } from "../../globals";
import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";

const originalMaterialsData = new Map<
  FRAGS.BIMMaterial,
  { color: number; transparent: boolean; opacity: number; lodOpacity?: number }
>();

export interface ViewerToolbarState {
  components: OBC.Components;
  world: OBC.World;
}

export const viewerToolbarTemplate: BUI.StatefullComponent<
  ViewerToolbarState
> = (state) => {
  const { components, world } = state;

  let colorInput: BUI.ColorInput | undefined;

  const onInputCreated = (e?: Element) => {
    if (!e) return;
    colorInput = e as BUI.ColorInput;
  };

  // ✅ PALETA DE COLORES
  const palette = [
    "#ff3b30", // rojo
    "#ff9500", // naranja
    "#ffcc00", // amarillo
    "#34c759", // verde
    "#00c7be", // turquesa
    "#007aff", // azul
    "#5856d6", // morado
    "#ff2d55", // rosa
    "#ffffff", // blanco
    "#8e8e93", // gris
  ];

  // helper: asigna color a bim-color-input
  const setPaletteColor = (hex: string) => {
    if (!colorInput) return;
    colorInput.color = hex;
  };

  const onApplyColor = async ({ target: button }: { target: BUI.Button }) => {
    if (!colorInput) return;
    const { color } = colorInput;

    const highlighter = components.get(OBF.Highlighter);
    const selection = highlighter.selection.select;
    if (OBC.ModelIdMapUtils.isEmpty(selection)) return;

    button.loading = true;

    if (!highlighter.styles.has(color)) {
      highlighter.styles.set(color, {
        color: new THREE.Color(color),
        renderedFaces: 1,
        opacity: 1,
        transparent: false,
      });
    }

    await Promise.all([
      highlighter.highlightByID(color, selection, false, false),
      highlighter.clear("select"),
    ]);

    button.loading = false;
    BUI.ContextMenu.removeMenus();
  };

  const onReset = async ({ target }: { target: BUI.Button }) => {
    target.loading = true;
    const highlighter = components.get(OBF.Highlighter);
    await highlighter.clear();
    BUI.ContextMenu.removeMenus();
    target.loading = false;
  };

  const onHide = async ({ target }: { target: BUI.Button }) => {
    const highlighter = components.get(OBF.Highlighter);
    const selection = highlighter.selection.select;
    if (OBC.ModelIdMapUtils.isEmpty(selection)) return;

    target.loading = true;
    const hider = components.get(OBC.Hider);
    await Promise.all([hider.set(false, selection), highlighter.clear("select")]);
    target.loading = false;
  };

  const onIsolate = async ({ target }: { target: BUI.Button }) => {
    const highlighter = components.get(OBF.Highlighter);
    const selection = highlighter.selection.select;
    if (OBC.ModelIdMapUtils.isEmpty(selection)) return;

    target.loading = true;
    const hider = components.get(OBC.Hider);
    await hider.isolate(selection);
    target.loading = false;
  };

  const onShowAll = async ({ target }: { target: BUI.Button }) => {
    target.loading = true;
    const hider = components.get(OBC.Hider);
    await hider.set(true);
    target.loading = false;
  };

  const onToggleGhost = () => {
    const fragments = components.get(OBC.FragmentsManager);

    if (originalMaterialsData.size > 0) {
      for (const [material, data] of originalMaterialsData) {
        material.transparent = data.transparent;
        material.opacity = data.opacity;
        if ("color" in material) material.color.setHex(data.color);
        material.needsUpdate = true;
      }
      originalMaterialsData.clear();
    } else {
      for (const material of fragments.core.models.materials.list.values()) {
        if ("color" in material) {
          originalMaterialsData.set(material, {
            color: material.color.getHex(),
            transparent: material.transparent,
            opacity: material.opacity,
          });
          material.transparent = true;
          material.opacity = 0.05;
          material.color.setColorName("white");
          material.needsUpdate = true;
        }
      }
    }
  };

  const onFocus = async ({ target }: { target: BUI.Button }) => {
    if (!(world.camera instanceof OBC.SimpleCamera)) return;

    const highlighter = components.get(OBF.Highlighter);
    const selection = highlighter.selection.select;

    target.loading = true;
    await world.camera.fitToItems(
      OBC.ModelIdMapUtils.isEmpty(selection) ? undefined : selection
    );
    target.loading = false;
  };

  return BUI.html`
    <bim-toolbar>
      <bim-toolbar-section label="Visibility" icon=${appIcons.SHOW}>
        <bim-button icon=${appIcons.SHOW} label="Show All" @click=${onShowAll}></bim-button>
        <bim-button icon=${appIcons.TRANSPARENT} label="Toggle Ghost" @click=${onToggleGhost}></bim-button>
      </bim-toolbar-section>

      <bim-toolbar-section label="Selection" icon=${appIcons.SELECT}>
        <bim-button icon=${appIcons.FOCUS} label="Focus" @click=${onFocus}></bim-button>
        <bim-button icon=${appIcons.HIDE} label="Hide" @click=${onHide}></bim-button>
        <bim-button icon=${appIcons.ISOLATE} label="Isolate" @click=${onIsolate}></bim-button>

        <bim-button icon=${appIcons.COLORIZE} label="Colorize">
          <bim-context-menu>
            <div style="display:flex; flex-direction:column; gap:0.5rem;">

              <!-- 🎨 PALETA -->
              <div style="display:flex; flex-wrap:wrap; gap:0.35rem; max-width:16rem;">
                ${palette.map(
                  (hex) => BUI.html`
                    <button
                      title=${hex}
                      @click=${() => setPaletteColor(hex)}
                      style="
                        width:22px;
                        height:22px;
                        border-radius:6px;
                        border:1px solid rgba(255,255,255,0.25);
                        background:${hex};
                        cursor:pointer;
                      "
                    ></button>
                  `
                )}
              </div>

              <!-- selector libre -->
              <bim-color-input ${BUI.ref(onInputCreated)}></bim-color-input>

              <div style="display:flex; gap:0.5rem;">
                <bim-button @click=${onApplyColor} icon=${appIcons.APPLY} label="Apply"></bim-button>
                <bim-button icon=${appIcons.CLEAR} label="Reset" @click=${onReset}></bim-button>
              </div>
            </div>
          </bim-context-menu>
        </bim-button>
      </bim-toolbar-section>
    </bim-toolbar>
  `;
};
