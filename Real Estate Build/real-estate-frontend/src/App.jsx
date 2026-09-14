import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage.jsx';
import PropertyDetailPage from './pages/PropertyDetailPage.jsx';

// Phase 3: real client-side routing replaces the single-page Phase 1 setup.
// Note for deployment: BrowserRouter needs the host to rewrite unknown
// paths back to index.html (standard on Netlify/Vercel/etc. via a
// catch-all rewrite rule) - otherwise a hard refresh on /property/:id
// 404s at the server before React Router ever gets a chance to run.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
