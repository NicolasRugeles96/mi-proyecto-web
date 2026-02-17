import * as OBC from "@thatopen/components";
import type { DataEnhancerSourceMap } from "./types";

export class DataEnhancer {
  private _components: OBC.Components;
  private _sources = new Map<string, DataEnhancerSourceMap>();

  constructor(components: OBC.Components) {
    this._components = components;
  }

  // =====================================================
  // API EXISTENTE (ejemplo mínimo)
  // =====================================================

  registerSource(name: string, source: DataEnhancerSourceMap) {
    this._sources.set(name, source);
  }

  async getData(items: OBC.ModelIdMap) {
    const result = new Map<
      string,
      Map<number, Record<string, any[]>>
    >();

    for (const [modelId, localIds] of items) {
      const modelMap = new Map<number, Record<string, any[]>>();
      result.set(modelId, modelMap);

      for (const localId of localIds) {
        const entry: Record<string, any[]> = {};

        for (const [name, source] of this._sources) {
          entry[name] = await source.getData({
            modelId,
            localId,
          });
        }

        modelMap.set(localId, entry);
      }
    }

    return result;
  }

  // =====================================================
  // ✅ HELPERS PRIVADOS
  // =====================================================

  private _addToModelIdMap(
    map: OBC.ModelIdMap,
    modelId: string,
    localId: number
  ) {
    let set = map.get(modelId);
    if (!set) {
      set = new Set<number>();
      map.set(modelId, set);
    }
    set.add(localId);
  }

  private _getByPath(obj: any, path: string) {
    return path
      .split(".")
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  // =====================================================
  // ✅ RETO 3 — BUSCAR ÍTEMS CON LA MISMA INFO
  // =====================================================

  async findItemsSharingSameInfo(params: {
    source: string;
    candidates: OBC.ModelIdMap;
    reference: { modelId: string; localId: number };
    fieldPath: string;
  }) {
    const { source, candidates, reference, fieldPath } = params;

    // 1) Traer data enriquecida
    const dataMap = await this.getData(candidates);

    // 2) Obtener valor de referencia
    const refSources =
      dataMap.get(reference.modelId)?.get(reference.localId);
    const refArr = refSources?.[source];

    if (!refArr || refArr.length === 0) {
      return new Map() as OBC.ModelIdMap;
    }

    const refValue = this._getByPath(refArr[0], fieldPath);

    if (refValue === undefined) {
      console.warn(
        `[DataEnhancer] fieldPath "${fieldPath}" no existe en source "${source}".`
      );
      return new Map() as OBC.ModelIdMap;
    }

    const refComparable =
      typeof refValue === "object"
        ? JSON.stringify(refValue)
        : String(refValue);

    // 3) Buscar coincidencias
    const result = new Map() as OBC.ModelIdMap;

    for (const [modelId, modelData] of dataMap) {
      for (const [localId, sources] of modelData) {
        const arr = sources[source];
        if (!arr || arr.length === 0) continue;

        const hasSame = arr.some((entry: any) => {
          const v = this._getByPath(entry, fieldPath);
          const comparable =
            typeof v === "object"
              ? JSON.stringify(v)
              : String(v);
          return comparable === refComparable;
        });

        if (hasSame) {
          this._addToModelIdMap(result, modelId, localId);
        }
      }
    }

    return result;
  }
}
