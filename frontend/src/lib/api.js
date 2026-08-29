const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  stats: () => request("/stats"),

  listBuildings: () => request("/buildings"),
  getBuilding: (id) => request(`/buildings/${id}`),
  createBuilding: (data) => request("/buildings", { method: "POST", body: JSON.stringify(data) }),
  updateBuilding: (id, data) => request(`/buildings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBuilding: (id) => request(`/buildings/${id}`, { method: "DELETE" }),

  sliceFloors: (data) => request("/floors/slice", { method: "POST", body: JSON.stringify(data) }),
  listFloorsForBuilding: (buildingId) => request(`/floors/building/${buildingId}`),
  getFloor: (id) => request(`/floors/${id}`),

  listUnits: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/units${qs ? `?${qs}` : ""}`);
  },
  searchUlpin: (ulpinId) => request(`/units/search/${encodeURIComponent(ulpinId)}`),
  createUnit: (data) => request("/units", { method: "POST", body: JSON.stringify(data) }),
  updateUnit: (id, data) => request(`/units/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteUnit: (id) => request(`/units/${id}`, { method: "DELETE" }),

  uploadModel: async (file) => {
    const form = new FormData();
    form.append("model", file);
    return request("/upload", { method: "POST", body: form });
  },
};
