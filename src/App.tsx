import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Recipes from "@/pages/Recipes";
import Steps from "@/pages/Steps";
import Feasts from "@/pages/Feasts";
import Reviews from "@/pages/Reviews";
import Stats from "@/pages/Stats";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/steps" element={<Steps />} />
          <Route path="/feasts" element={<Feasts />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/stats" element={<Stats />} />
        </Route>
      </Routes>
    </Router>
  );
}
