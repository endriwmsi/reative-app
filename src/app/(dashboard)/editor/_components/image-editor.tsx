"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { ASPECT_RATIOS } from "./constants";
import { EditorSidebar } from "./editor-sidebar";
import type { EditorElement, ElementType } from "./types";
import { rotatePoint, roundRect, wrapText } from "./utils";

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState(ASPECT_RATIOS["4:5"]);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragAction, setDragAction] = useState<
    "move" | "resize" | "rotate" | null
  >(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("add");
  const [initialElementState, setInitialElementState] =
    useState<EditorElement | null>(null);
  const [snapLines, setSnapLines] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  // Initialize scale
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = (clientWidth - 40) / canvasSize.width;
      const scaleY = (clientHeight - 40) / canvasSize.height;
      setScale(Math.min(scaleX, scaleY, 1));
    }
  }, [canvasSize]);

  // Draw function
  const draw = useCallback(
    (isExporting?: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sort elements by zIndex
      const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

      sortedElements.forEach((el) => {
        ctx.save();
        // Translate to center of element for rotation
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-(el.x + el.width / 2), -(el.y + el.height / 2));
        ctx.globalAlpha = el.opacity ?? 1;

        if (el.type === "image" && el.content) {
          const img = new Image();
          img.src = el.content;
          if (img.complete) {
            ctx.drawImage(img, el.x, el.y, el.width, el.height);
          } else {
            img.onload = () => draw();
          }
        } else if (el.type === "text" && el.content) {
          ctx.font = `${el.fontWeight || "normal"} ${el.fontSize || 30}px ${el.fontFamily || "Arial"}`;
          ctx.fillStyle = el.color || "#000000";
          ctx.textBaseline = "top";
          wrapText(
            ctx,
            el.content,
            el.x,
            el.y,
            el.width,
            (el.fontSize || 30) * 1.2,
            el.textAlign || "left",
          );
        } else if (el.type === "shape") {
          ctx.fillStyle = el.color || "#cccccc";
          if (el.shapeType === "circle") {
            ctx.beginPath();
            ctx.ellipse(
              el.x + el.width / 2,
              el.y + el.height / 2,
              el.width / 2,
              el.height / 2,
              0,
              0,
              2 * Math.PI,
            );
            ctx.fill();
          } else {
            // Rectangle
            roundRect(
              ctx,
              el.x,
              el.y,
              el.width,
              el.height,
              el.borderRadius || 0,
              true,
              false,
            );
          }
        } else if (el.type === "button") {
          // Button Background
          ctx.fillStyle = el.backgroundColor || "#3b82f6";
          roundRect(
            ctx,
            el.x,
            el.y,
            el.width,
            el.height,
            el.borderRadius || 10,
            true,
            false,
          );

          // Button Text
          if (el.content) {
            ctx.font = `${el.fontWeight || "bold"} ${el.fontSize || 24}px ${el.fontFamily || "Arial"}`;
            ctx.fillStyle = el.color || "#ffffff";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(
              el.content,
              el.x + el.width / 2,
              el.y + el.height / 2,
              el.width,
            );
          }
        }

        ctx.restore();

        // Draw selection border
        if (!isExporting && el.id === selectedId) {
          ctx.save();
          ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
          ctx.rotate((el.rotation * Math.PI) / 180);
          ctx.translate(-(el.x + el.width / 2), -(el.y + el.height / 2));

          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.strokeRect(el.x, el.y, el.width, el.height);

          // Draw resize handles
          const handleSize = 12;
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;

          const handles = [
            { x: el.x - handleSize / 2, y: el.y - handleSize / 2 }, // TL
            {
              x: el.x + el.width / 2 - handleSize / 2,
              y: el.y - handleSize / 2,
            }, // T
            { x: el.x + el.width - handleSize / 2, y: el.y - handleSize / 2 }, // TR
            {
              x: el.x + el.width - handleSize / 2,
              y: el.y + el.height / 2 - handleSize / 2,
            }, // R
            {
              x: el.x + el.width - handleSize / 2,
              y: el.y + el.height - handleSize / 2,
            }, // BR
            {
              x: el.x + el.width / 2 - handleSize / 2,
              y: el.y + el.height - handleSize / 2,
            }, // B
            { x: el.x - handleSize / 2, y: el.y + el.height - handleSize / 2 }, // BL
            {
              x: el.x - handleSize / 2,
              y: el.y + el.height / 2 - handleSize / 2,
            }, // L
          ];

          handles.forEach((h) => {
            ctx.fillRect(h.x, h.y, handleSize, handleSize);
            ctx.strokeRect(h.x, h.y, handleSize, handleSize);
          });

          // Rotation Handle
          ctx.beginPath();
          ctx.moveTo(el.x + el.width / 2, el.y);
          ctx.lineTo(el.x + el.width / 2, el.y - 25);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(el.x + el.width / 2, el.y - 25, 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      });

      if (!isExporting) {
        // Draw Guides (100px margin)
        ctx.save();
        ctx.strokeStyle = "rgba(0, 150, 255, 0.6)";
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        const margin = 100;
        // Vertical Left
        ctx.beginPath();
        ctx.moveTo(margin, 0);
        ctx.lineTo(margin, canvas.height);
        ctx.stroke();
        // Vertical Right
        ctx.beginPath();
        ctx.moveTo(canvas.width - margin, 0);
        ctx.lineTo(canvas.width - margin, canvas.height);
        ctx.stroke();
        // Horizontal Top
        ctx.beginPath();
        ctx.moveTo(0, margin);
        ctx.lineTo(canvas.width, margin);
        ctx.stroke();
        // Horizontal Bottom
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - margin);
        ctx.lineTo(canvas.width, canvas.height - margin);
        ctx.stroke();
        ctx.restore();

        // Draw Snap Lines
        if (snapLines.x !== null || snapLines.y !== null) {
          ctx.save();
          ctx.strokeStyle = "#ff00ff";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);

          if (snapLines.x !== null) {
            ctx.beginPath();
            ctx.moveTo(snapLines.x, 0);
            ctx.lineTo(snapLines.x, canvas.height);
            ctx.stroke();
          }

          if (snapLines.y !== null) {
            ctx.beginPath();
            ctx.moveTo(0, snapLines.y);
            ctx.lineTo(canvas.width, snapLines.y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    },
    [elements, selectedId, snapLines],
  );

  useEffect(() => {
    draw();
  }, [draw, canvasSize]);

  // Mouse Event Handlers
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { x, y } = getMousePos(e);

    // Check handles first if selected
    if (selectedId) {
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        // Rotate mouse point into element's local space
        const localMouse = rotatePoint(x, y, cx, cy, -el.rotation);

        const handleSize = 15 / scale; // Hit area

        // Rotation Handle
        if (
          Math.abs(localMouse.x - cx) < handleSize &&
          Math.abs(localMouse.y - (el.y - 25)) < handleSize
        ) {
          setDragAction("rotate");
          setIsDragging(true);
          setInitialElementState({ ...el });
          return;
        }

        // Resize Handles
        const handles = [
          { name: "nw", x: el.x, y: el.y },
          { name: "n", x: el.x + el.width / 2, y: el.y },
          { name: "ne", x: el.x + el.width, y: el.y },
          { name: "e", x: el.x + el.width, y: el.y + el.height / 2 },
          { name: "se", x: el.x + el.width, y: el.y + el.height },
          { name: "s", x: el.x + el.width / 2, y: el.y + el.height },
          { name: "sw", x: el.x, y: el.y + el.height },
          { name: "w", x: el.x, y: el.y + el.height / 2 },
        ];

        for (const h of handles) {
          if (
            Math.abs(localMouse.x - h.x) < handleSize &&
            Math.abs(localMouse.y - h.y) < handleSize
          ) {
            setDragAction("resize");
            setResizeHandle(h.name);
            setIsDragging(true);
            setDragStart({ x, y }); // Canvas space start
            setInitialElementState({ ...el });
            return;
          }
        }
      }
    }

    // Check element selection
    // We need to check in reverse order (top to bottom)
    // And we need to check if the point is inside the ROTATED rectangle
    const clickedElement = [...elements]
      .sort((a, b) => a.zIndex - b.zIndex)
      .reverse()
      .find((el) => {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const localMouse = rotatePoint(x, y, cx, cy, -el.rotation);

        return (
          localMouse.x >= el.x &&
          localMouse.x <= el.x + el.width &&
          localMouse.y >= el.y &&
          localMouse.y <= el.y + el.height
        );
      });

    if (clickedElement) {
      setSelectedId(clickedElement.id);
      setIsDragging(true);
      setDragAction("move");
      setDragStart({ x, y });
      setInitialElementState({ ...clickedElement });
      setActiveTab("edit");
    } else {
      setSelectedId(null);
      setActiveTab("add");
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId || !initialElementState) return;
    const { x, y } = getMousePos(e);

    if (dragAction === "move") {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      let newX = initialElementState.x + dx;
      let newY = initialElementState.y + dy;

      // Snapping Logic
      const SNAP_THRESHOLD = 10;
      const MARGIN = 100;
      const { width: canvasW, height: canvasH } = canvasSize;
      const { width: elW, height: elH } = initialElementState;

      let snappedX: number | null = null;
      let snappedY: number | null = null;

      // Snap X
      if (Math.abs(newX) < SNAP_THRESHOLD) {
        newX = 0;
        snappedX = 0;
      }
      if (Math.abs(newX + elW - canvasW) < SNAP_THRESHOLD) {
        newX = canvasW - elW;
        snappedX = canvasW;
      }
      if (Math.abs(newX - MARGIN) < SNAP_THRESHOLD) {
        newX = MARGIN;
        snappedX = MARGIN;
      }
      if (Math.abs(newX + elW - (canvasW - MARGIN)) < SNAP_THRESHOLD) {
        newX = canvasW - MARGIN - elW;
        snappedX = canvasW - MARGIN;
      }
      if (Math.abs(newX + elW / 2 - canvasW / 2) < SNAP_THRESHOLD) {
        newX = canvasW / 2 - elW / 2;
        snappedX = canvasW / 2;
      }

      // Snap Y
      if (Math.abs(newY) < SNAP_THRESHOLD) {
        newY = 0;
        snappedY = 0;
      }
      if (Math.abs(newY + elH - canvasH) < SNAP_THRESHOLD) {
        newY = canvasH - elH;
        snappedY = canvasH;
      }
      if (Math.abs(newY - MARGIN) < SNAP_THRESHOLD) {
        newY = MARGIN;
        snappedY = MARGIN;
      }
      if (Math.abs(newY + elH - (canvasH - MARGIN)) < SNAP_THRESHOLD) {
        newY = canvasH - MARGIN - elH;
        snappedY = canvasH - MARGIN;
      }
      if (Math.abs(newY + elH / 2 - canvasH / 2) < SNAP_THRESHOLD) {
        newY = canvasH / 2 - elH / 2;
        snappedY = canvasH / 2;
      }

      setSnapLines({ x: snappedX, y: snappedY });

      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedId
            ? {
                ...el,
                x: newX,
                y: newY,
              }
            : el,
        ),
      );
    } else if (dragAction === "rotate") {
      const el = initialElementState;
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      const angleDeg = (angle * 180) / Math.PI;
      // Snap to 45 degrees if Shift is held
      let rotation = angleDeg + 90; // +90 because handle is at top (-90)
      if (e.shiftKey) {
        rotation = Math.round(rotation / 45) * 45;
      }
      setElements((prev) =>
        prev.map((item) =>
          item.id === selectedId ? { ...item, rotation } : item,
        ),
      );
    } else if (dragAction === "resize") {
      const el = initialElementState;
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;

      // Rotate mouse position to local space relative to initial center
      const localMouse = rotatePoint(x, y, cx, cy, -el.rotation);
      const localStart = rotatePoint(
        dragStart.x,
        dragStart.y,
        cx,
        cy,
        -el.rotation,
      );

      const dx = localMouse.x - localStart.x;
      const dy = localMouse.y - localStart.y;

      let newX = el.x;
      let newY = el.y;
      let newW = el.width;
      let newH = el.height;

      const keepRatio = e.altKey;
      const ratio = el.width / el.height;

      if (resizeHandle?.includes("e")) {
        newW += dx;
        if (keepRatio) newH = newW / ratio;
      }
      if (resizeHandle?.includes("w")) {
        newW -= dx;
        newX += dx;
        if (keepRatio) {
          // const oldW = newW + dx; // revert
          // Complex to handle center-based scaling with ratio on left side
          // Simplified: just scale width
        }
      }
      if (resizeHandle?.includes("s")) {
        newH += dy;
        if (keepRatio) newW = newH * ratio;
      }
      if (resizeHandle?.includes("n")) {
        newH -= dy;
        newY += dy;
      }

      // Min size
      if (newW < 20) newW = 20;
      if (newH < 20) newH = 20;

      // Drift Correction
      // We calculated newX, newY, newW, newH in the "unrotated" frame.
      // But since we changed dimensions, the center point (around which we rotate) has moved.
      // We need to adjust x,y so that the "anchor" point stays fixed in canvas space.

      // 1. Find anchor point in local unrotated space (e.g. if dragging SE, anchor is NW)
      // let anchorX = el.x;
      // let anchorY = el.y;
      // if (resizeHandle?.includes("w")) anchorX = el.x + el.width;
      // if (resizeHandle?.includes("n")) anchorY = el.y + el.height;
      // If dragging side, anchor is opposite side center?
      // Let's stick to corner logic for simplicity or use center-based logic.

      // Actually, simpler approach:
      // Calculate where the anchor point IS currently in canvas space.
      // Calculate where it WOULD BE with new dimensions.
      // Shift to match.

      const getAnchor = (handle: string) => {
        if (handle === "se") return { x: el.x, y: el.y }; // NW
        if (handle === "sw") return { x: el.x + el.width, y: el.y }; // NE
        if (handle === "ne") return { x: el.x, y: el.y + el.height }; // SW
        if (handle === "nw") return { x: el.x + el.width, y: el.y + el.height }; // SE
        if (handle === "e") return { x: el.x, y: el.y + el.height / 2 }; // W-Center
        if (handle === "w")
          return { x: el.x + el.width, y: el.y + el.height / 2 }; // E-Center
        if (handle === "s") return { x: el.x + el.width / 2, y: el.y }; // N-Center
        if (handle === "n")
          return { x: el.x + el.width / 2, y: el.y + el.height }; // S-Center
        return { x: el.x, y: el.y };
      };

      const anchorLocal = getAnchor(resizeHandle || "");
      // Anchor in canvas space (initial)
      const anchorCanvas = rotatePoint(
        anchorLocal.x,
        anchorLocal.y,
        cx,
        cy,
        el.rotation,
      );

      // New Center (unrotated)
      const newCx = newX + newW / 2;
      const newCy = newY + newH / 2;

      // Where is the anchor now in local space?
      // It should be the same relative corner/side.
      let newAnchorLocalX = newX;
      let newAnchorLocalY = newY;
      if (resizeHandle?.includes("w")) newAnchorLocalX = newX + newW;
      if (resizeHandle?.includes("n")) newAnchorLocalY = newY + newH;
      if (resizeHandle === "e") newAnchorLocalY = newY + newH / 2;
      if (resizeHandle === "w") newAnchorLocalY = newY + newH / 2;
      if (resizeHandle === "s") newAnchorLocalX = newX + newW / 2;
      if (resizeHandle === "n") newAnchorLocalX = newX + newW / 2;

      // Where is that anchor in canvas space now?
      const newAnchorCanvas = rotatePoint(
        newAnchorLocalX,
        newAnchorLocalY,
        newCx,
        newCy,
        el.rotation,
      );

      // Calculate shift needed
      const shiftX = anchorCanvas.x - newAnchorCanvas.x;
      const shiftY = anchorCanvas.y - newAnchorCanvas.y;

      setElements((prev) =>
        prev.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                x: newX + shiftX,
                y: newY + shiftY,
                width: newW,
                height: newH,
              }
            : item,
        ),
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragAction(null);
    setResizeHandle(null);
    setInitialElementState(null);
    setSnapLines({ x: null, y: null });
  };

  // Element Actions
  const addElement = (
    type: ElementType,
    extra: Partial<EditorElement> = {},
  ) => {
    const newEl: EditorElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 50,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      zIndex: elements.length + 1,
      ...extra,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setActiveTab("edit");
  };

  const addText = () => {
    addElement("text", {
      content: "Seu Texto Aqui",
      color: "#000000",
      fontSize: 40,
      fontFamily: "Arial",
      height: 60,
      textAlign: "center",
    });
  };

  const addShape = (shapeType: "rectangle" | "circle") => {
    addElement("shape", {
      shapeType,
      color: "#3b82f6",
      width: 200,
      height: 200,
      borderRadius: shapeType === "rectangle" ? 0 : 100,
    });
  };

  const addButton = () => {
    addElement("button", {
      content: "Clique Aqui",
      backgroundColor: "#000000",
      color: "#ffffff",
      fontSize: 30,
      fontFamily: "Arial",
      borderRadius: 10,
      width: 250,
      height: 80,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > 500) {
          const ratio = 500 / width;
          width = 500;
          height = height * ratio;
        }
        addElement("image", {
          content: event.target?.result as string,
          width,
          height,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const updateSelected = (updates: Partial<EditorElement>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, ...updates } : el)),
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
    setActiveTab("add");
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    draw(true);
    const link = document.createElement("a");
    link.download = "criativo-hub-ln.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    draw(false);
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-150px)]">
      {/* Sidebar */}
      <EditorSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedElement={selectedElement}
        addText={addText}
        addButton={addButton}
        addShape={addShape}
        fileInputRef={fileInputRef}
        logoInputRef={logoInputRef}
        handleImageUpload={handleImageUpload}
        canvasSize={canvasSize}
        setCanvasSize={setCanvasSize}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
        downloadImage={downloadImage}
      />

      {/* Canvas Area */}
      <Card
        ref={containerRef}
        className="w-full h-[50vh] lg:h-auto lg:flex-1 bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden p-8 border border-dashed relative"
        onMouseDown={() => {
          setSelectedId(null);
          setActiveTab("add");
        }}
      >
        <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
          {canvasSize.label}
        </div>
        <div
          style={{
            width: canvasSize.width * scale,
            height: canvasSize.height * scale,
            boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
          className="transition-all duration-300 ease-in-out"
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{
              width: "100%",
              height: "100%",
              cursor: isDragging ? "grabbing" : "default",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </Card>
    </div>
  );
}
