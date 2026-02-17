import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { DataEnhancer } from "../../DataEnhancer";
import { ItemData } from "@thatopen/fragments";
import { getCollection } from "../../../firebase";
import { getDocs } from "firebase/firestore";

export const setupDataEnhancer = (components: OBC.Components) => {
  const enhancer = components.get(DataEnhancer);

  // =====================================================
  // SOURCE: Technical Documentation (JSON local)
  // =====================================================
  enhancer.sources.set("Technical Documentation", {
    data: async () => {
      const file = await fetch("/resources/technical_documentation.json");
      const json = await file.json();
      return json;
    },
    matcher: (attrs: ItemData, data: any[]) => {
      const categoryData = attrs._category;
      if (!(categoryData && "value" in categoryData)) return null;

      const category = categoryData.value;
      const dataSubset = data.filter(
        (entry) => entry.category === category
      );

      return dataSubset.length > 0 ? dataSubset : null;
    },
  });

  // =====================================================
  // SOURCE: Activities (Firebase)
  // =====================================================
  enhancer.sources.set("Activities", {
    data: async () => {
      const url = location.href;
      const match = url.match(/\/project\/([^\/]+)/);
      const projectId = match ? match[1] : null;
      if (!projectId) return [];

      const activitiesCollection = getCollection(
        `/projects/${projectId}/activities`
      );
      const firebaseProjects = await getDocs(activitiesCollection);

      const sourceData: any[] = [];
      for (const doc of firebaseProjects.docs) {
        sourceData.push(doc.data());
      }
      return sourceData;
    },
    matcher: (attrs: ItemData, data: any[]) => {
      const guidData = attrs._guid;
      if (!(guidData && "value" in guidData)) return null;

      const guid = guidData.value;
      const dataSubset = data.filter((entry) =>
        entry.guids.includes(guid)
      );

      return dataSubset.length > 0 ? dataSubset : null;
    },
  });

  // =====================================================
  // ✅ SELECCIÓN → PROBAR findItemsSharingSameInfo
  // =====================================================
  const highlighter = components.get(OBF.Highlighter);

  highlighter.events.select.onHighlight.add(async (items) => {
    // 1️⃣ Ver data enriquecida (para descubrir fieldPath)
    const data = await enhancer.getData(items);
    console.log("ENHANCED DATA:", data);

    // 2️⃣ Obtener ítem de referencia (primer seleccionado)
    let refModelId: string | null = null;
    let refLocalId: number | null = null;

    for (const [modelId, localIds] of items) {
      const first = localIds.values().next().value;
      if (first !== undefined) {
        refModelId = modelId;
        refLocalId = first;
        break;
      }
    }

    if (!refModelId || refLocalId === null) return;

    // 3️⃣ Buscar ítems con la misma información
    const shared = await enhancer.findItemsSharingSameInfo({
      source: "Technical Documentation", // o "Activities"
      candidates: items,                 // por ahora solo dentro de la selección
      reference: {
        modelId: refModelId,
        localId: refLocalId,
      },
      fieldPath: "codigo", // ⚠️ AJUSTA según lo que veas en consola
    });

    console.log("ITEMS WITH SAME INFO:", shared);

    // 4️⃣ (Opcional) resaltarlos para verificar visualmente
    // await highlighter.highlightByID("select", shared);
  });
};
