import { useLocation } from 'react-router-dom';
import { getPlantationSchemeFromPath } from './plantationConstants.js';
import PlantationStandardEntryView from './PlantationStandardEntryView.jsx';

export default function PlantationScheme2024View() {
  const { pathname } = useLocation();
  const scheme = getPlantationSchemeFromPath(pathname);

  return (
    <PlantationStandardEntryView
      scheme={scheme}
      idPrefix={`plantation-scheme-${scheme.id}`}
    />
  );
}
