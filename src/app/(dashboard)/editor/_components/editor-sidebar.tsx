import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Circle,
  Download,
  Image as ImageIcon,
  MousePointer2,
  Plus,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ASPECT_RATIOS, FONTS, PRESET_COLORS } from "./constants";
import type { EditorElement } from "./types";

interface EditorSidebarProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  selectedElement: EditorElement | undefined;
  addText: () => void;
  addButton: () => void;
  addShape: (type: "rectangle" | "circle") => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canvasSize: { width: number; height: number; label: string };
  setCanvasSize: (size: any) => void;
  updateSelected: (updates: Partial<EditorElement>) => void;
  deleteSelected: () => void;
  downloadImage: () => void;
}

export function EditorSidebar({
  activeTab,
  setActiveTab,
  selectedElement,
  addText,
  addButton,
  addShape,
  fileInputRef,
  logoInputRef,
  handleImageUpload,
  canvasSize,
  setCanvasSize,
  updateSelected,
  deleteSelected,
  downloadImage,
}: EditorSidebarProps) {
  return (
    <div className="w-full lg:w-96 flex flex-col gap-4 p-4 border rounded-lg bg-card overflow-y-auto shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">Adicionar</TabsTrigger>
          <TabsTrigger value="edit" disabled={!selectedElement}>
            Editar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Elementos Básicos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={addText}
                className="h-14 flex flex-row items-center justify-center gap-2 hover:bg-accent/50 hover:border-primary/50 transition-all"
              >
                <Type className="h-4 w-4" />
                <span>Texto</span>
              </Button>
              <Button
                variant="outline"
                onClick={addButton}
                className="h-14 flex flex-row items-center justify-center gap-2 hover:bg-accent/50 hover:border-primary/50 transition-all"
              >
                <MousePointer2 className="h-4 w-4" />
                <span>Botão</span>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Formas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => addShape("rectangle")}
                className="h-14 flex flex-row items-center justify-center gap-2 hover:bg-accent/50 hover:border-primary/50 transition-all"
              >
                <Square className="h-4 w-4" />
                <span>Quadrado</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => addShape("circle")}
                className="h-14 flex flex-row items-center justify-center gap-2 hover:bg-accent/50 hover:border-primary/50 transition-all"
              >
                <Circle className="h-4 w-4" />
                <span>Círculo</span>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Mídia
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mr-2 h-5 w-5" /> Carregar Imagem
                </Button>
              </div>
              <div className="relative">
                <Input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  id="logo-upload"
                />
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Plus className="mr-2 h-5 w-5" /> Adicionar Logo
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Tamanho do Canvas
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ASPECT_RATIOS).map(([key, ratio]) => (
                <Button
                  key={key}
                  variant={
                    canvasSize.label === ratio.label ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setCanvasSize(ratio)}
                  className="text-xs"
                >
                  {key}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-6 mt-4">
          {selectedElement && (
            <>
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="font-semibold">Propriedades</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={deleteSelected}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Text Content */}
              {(selectedElement.type === "text" ||
                selectedElement.type === "button") && (
                <div className="space-y-2">
                  <Label>Conteúdo do Texto</Label>
                  <Input
                    value={selectedElement.content}
                    onChange={(e) =>
                      updateSelected({ content: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Font Settings */}
              {(selectedElement.type === "text" ||
                selectedElement.type === "button") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fonte</Label>
                    <Select
                      value={selectedElement.fontFamily || "Arial"}
                      onValueChange={(val) =>
                        updateSelected({ fontFamily: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONTS.map((font) => (
                          <SelectItem
                            key={font}
                            value={font}
                            style={{ fontFamily: font }}
                          >
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Alinhamento</Label>
                    <div className="flex border rounded-md overflow-hidden">
                      <Button
                        variant={
                          selectedElement.textAlign === "left"
                            ? "secondary"
                            : "ghost"
                        }
                        size="sm"
                        className="flex-1 rounded-none"
                        onClick={() => updateSelected({ textAlign: "left" })}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={
                          selectedElement.textAlign === "center"
                            ? "secondary"
                            : "ghost"
                        }
                        size="sm"
                        className="flex-1 rounded-none"
                        onClick={() => updateSelected({ textAlign: "center" })}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={
                          selectedElement.textAlign === "right"
                            ? "secondary"
                            : "ghost"
                        }
                        size="sm"
                        className="flex-1 rounded-none"
                        onClick={() => updateSelected({ textAlign: "right" })}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Colors */}
              <div className="space-y-2">
                <Label>
                  {selectedElement.type === "text"
                    ? "Cor do Texto"
                    : "Cor do Elemento"}
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={selectedElement.color || "#000000"}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                    className="w-10 h-10 p-1 rounded-md cursor-pointer"
                  />
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {PRESET_COLORS.slice(0, 5).map((c) => (
                      <Button
                        key={c}
                        className="w-6 h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: c }}
                        onClick={() => updateSelected({ color: c })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {selectedElement.type === "button" && (
                <div className="space-y-2">
                  <Label>Cor do Fundo</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={selectedElement.backgroundColor || "#000000"}
                      onChange={(e) =>
                        updateSelected({ backgroundColor: e.target.value })
                      }
                      className="w-10 h-10 p-1 rounded-md cursor-pointer"
                    />
                    <div className="flex-1 grid grid-cols-5 gap-1">
                      {PRESET_COLORS.slice(0, 5).map((c) => (
                        <Button
                          key={c}
                          className="w-6 h-6 rounded-full border shadow-sm"
                          style={{ backgroundColor: c }}
                          onClick={() => updateSelected({ backgroundColor: c })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Size & Opacity */}
              <div className="space-y-4">
                {(selectedElement.type === "text" ||
                  selectedElement.type === "button") && (
                  <div className="space-y-2">
                    <Label>Tamanho da Fonte</Label>
                    <input
                      type="range"
                      className="w-full accent-primary"
                      value={selectedElement.fontSize || 20}
                      min={10}
                      max={200}
                      step={1}
                      onChange={(e) =>
                        updateSelected({ fontSize: Number(e.target.value) })
                      }
                    />
                  </div>
                )}

                {(selectedElement.type === "shape" ||
                  selectedElement.type === "button") && (
                  <div className="space-y-2">
                    <Label>Arredondamento</Label>
                    <input
                      type="range"
                      className="w-full accent-primary"
                      value={selectedElement.borderRadius || 0}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(e) =>
                        updateSelected({
                          borderRadius: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Opacidade</Label>
                  <input
                    type="range"
                    className="w-full accent-primary"
                    value={(selectedElement.opacity ?? 1) * 100}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) =>
                      updateSelected({
                        opacity: Number(e.target.value) / 100,
                      })
                    }
                  />
                </div>
              </div>

              {/* Layering */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Camadas</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      updateSelected({ zIndex: selectedElement.zIndex - 1 })
                    }
                  >
                    Enviar para Trás
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      updateSelected({ zIndex: selectedElement.zIndex + 1 })
                    }
                  >
                    Trazer para Frente
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-auto pt-4 border-t">
        <Button className="w-full" size="lg" onClick={downloadImage}>
          <Download className="mr-2 h-4 w-4" /> Baixar
        </Button>
      </div>
    </div>
  );
}
