
// Re-export all functions to maintain existing import structure
export { extractPropertyFromUrl, extractImagesFromUrl } from '@/services/propertyExtractionService';
export { 
  savePropertyToDatabase, 
  updatePropertyInDatabase, 
  deletePropertyFromDatabase, 
  loadSavedProperties 
} from '@/services/propertyDatabaseService';
export type { ExtractedPropertyData } from '@/types/extractedProperty';
