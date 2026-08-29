import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Viewer3D } from "../three/Viewer3D.jsx";
import { api } from "../lib/api.js";

const ACCEPTED_EXT = [".glb", ".gltf", ".obj"];

export default function Upload() {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [modelUrl, setModelUrl] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [buildingName, setBuildingName] = useState("");
  const [address, setAddress] = useState("");
  const [numFloors, setNumFloors] = useState(5);
  const [saving, setSaving] = useState(false);

  const handleFiles = useCallback((fileList) => {
    const picked = fileList[0];
    if (!picked) return;
    const ext = "." + picked.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      setError(`Unsupported file type "${ext}". Use .glb, .gltf, or .obj.`);
      return;
    }
    setError(null);
    setFile(picked);
    if (ext === ".glb" || ext === ".gltf") {
      setModelUrl(URL.createObjectURL(picked));
    } else {
      setModelUrl(null);
    }
  }, []);

  const heightMeters = bounds ? bounds.max.y - bounds.min.y : 16;

  async function handleSave() {
    if (!buildingName) {
      setError("Please enter a building name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let uploadedUrl = null;
      if (file && (file.name.endsWith(".glb") || file.name.endsWith(".gltf"))) {
        const result = await api.uploadModel(file);
        uploadedUrl = result.url;
      }

      const building = await api.createBuilding({
        name: buildingName,
        address,
        modelUrl: uploadedUrl,
        heightMeters,
      });

      await api.sliceFloors({
        buildingId: building.id,
        numFloors: Number(numFloors),
        floorHeight: heightMeters / Number(numFloors),
      });

      navigate(`/buildings/${building.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Upload Building Model</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Export a 3D scan from KIRI Engine as .glb/.gltf/.obj, then upload it here. No real model on hand?
        Skip upload and use the placeholder block to try the floor-slicing flow.
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
              dragging ? "border-amber-500 bg-amber-50" : "border-slate-300 bg-white"
            }`}
          >
            <p className="text-slate-600 mb-3">Drag & drop a .glb, .gltf, or .obj file here</p>
            <label className="inline-block cursor-pointer bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md">
              Browse files
              <input
                type="file"
                accept=".glb,.gltf,.obj"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
            {file && <p className="mt-4 text-sm text-slate-500">Selected: {file.name}</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-navy-900">Building Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Building name</label>
              <input
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder="e.g. Sunrise Towers"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. MG Road, Pune"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            </div>

            <h2 className="font-semibold text-navy-900 pt-2">Floor Slicing</h2>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Number of floors: <span className="text-navy-900 font-semibold">{numFloors}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={numFloors}
                onChange={(e) => setNumFloors(e.target.value)}
                className="w-full accent-amber-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              Model height: <strong>{heightMeters.toFixed(1)} m</strong> → each floor ≈{" "}
              <strong>{(heightMeters / numFloors).toFixed(2)} m</strong>
            </p>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-navy-950 font-semibold py-2.5 rounded-md transition-colors"
            >
              {saving ? "Saving…" : "Save Building & Slice Floors"}
            </button>
          </div>
        </div>

        <div className="h-[520px] lg:h-auto">
          <Viewer3D modelUrl={modelUrl} fallbackHeight={16} onBounds={setBounds} />
          <p className="text-xs text-slate-500 mt-2">
            {modelUrl
              ? "Live preview of your uploaded model."
              : "No model loaded — showing a placeholder building block."}
          </p>
        </div>
      </div>
    </div>
  );
}
