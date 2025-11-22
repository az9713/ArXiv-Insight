export enum InsightType {
  EXPLAIN = 'Explain',
  SLIDE = 'Create Slide',
  INFOGRAPHIC = 'Infographic',
  CODE = 'Generate Code',
  SUMMARY = 'Summarize Page'
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionData {
  pageNumber: number;
  rect: BoundingBox;
  imageBase64: string; // The cropped image of the selection
}

export interface InsightResult {
  id: string;
  type: InsightType;
  content: string; // Markdown text or Image URL
  isLoading: boolean;
  timestamp: number;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}