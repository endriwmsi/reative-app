export type ElementType = "text" | "image" | "shape" | "button";
export type TextAlign = "left" | "center" | "right";

export interface EditorElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: TextAlign;
  opacity?: number;
  zIndex: number;
  borderRadius?: number;
  shapeType?: "rectangle" | "circle";
}
