import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Upload from "./pages/Upload.jsx";
import Search from "./pages/Search.jsx";
import Owners from "./pages/Owners.jsx";
import BuildingDetail from "./pages/BuildingDetail.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/search" element={<Search />} />
          <Route path="/owners" element={<Owners />} />
          <Route path="/buildings/:id" element={<BuildingDetail />} />
        </Routes>
      </main>
    </div>
  );
}
