import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CriteriaProvider } from '@/contexts/CriteriaContext';

createRoot(document.getElementById("root")!).render(
  <CriteriaProvider>
    <App />
  </CriteriaProvider>
);
