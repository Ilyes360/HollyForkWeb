import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import './Salle.css';
import './Auth.css';

const API_MAPS = '/api/maps/';

const TABLE_SQUARE = 'table-square';
const TABLE_RECT = 'table-rect';
const TABLE_ROUND = 'table-round';
const WALL = 'wall';
const GREENERY_ROUND = 'greenery-round';
const GREENERY_LINE = 'greenery-line';
const ERASER_ELEMENT = 'eraser-element';

const DEFAULT_TABLE_SIZE = 48;
const WALL_THICKNESS = 14;
const GREENERY_THICKNESS = 12;
const GREENERY_RADIUS = 24;

function generateId() {
  return 'el-' + Math.random().toString(36).slice(2, 11);
}

function getPositionSnapshot(el) {
  if (el.type === TABLE_SQUARE || el.type === TABLE_RECT) return { x: el.x, y: el.y };
  if (el.type === TABLE_ROUND || el.type === GREENERY_ROUND) return { cx: el.cx, cy: el.cy };
  if (el.type === WALL || el.type === GREENERY_LINE) return { x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 };
  return {};
}

function applyDeltaToElement(el, start, dx, dy) {
  if (el.type === TABLE_SQUARE || el.type === TABLE_RECT) return { ...el, x: start.x + dx, y: start.y + dy };
  if (el.type === TABLE_ROUND || el.type === GREENERY_ROUND) return { ...el, cx: start.cx + dx, cy: start.cy + dy };
  if (el.type === WALL || el.type === GREENERY_LINE) return { ...el, x1: start.x1 + dx, y1: start.y1 + dy, x2: start.x2 + dx, y2: start.y2 + dy };
  return el;
}

export default function Salle() {
  const [elements, setElements] = useState([]);
  const [selectedTool, setSelectedTool] = useState(TABLE_SQUARE);
  const [linePreview, setLinePreview] = useState(null);
  const [drawingSegment, setDrawingSegment] = useState(null);
  const [editingTableId, setEditingTableId] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [draggingElementId, setDraggingElementId] = useState(null);
  const [savedMaps, setSavedMaps] = useState([]);
  const [currentMapId, setCurrentMapId] = useState(null);
  const [currentMapName, setCurrentMapName] = useState('');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [pendingTable, setPendingTable] = useState(null);
  const svgRef = useRef(null);

  const tableTools = [
    { id: TABLE_SQUARE, label: 'Carrée' },
    { id: TABLE_RECT, label: 'Rectangulaire' },
    { id: TABLE_ROUND, label: 'Ronde' },
  ];
  const greeneryTools = [
    { id: GREENERY_ROUND, label: 'Rond' },
    { id: GREENERY_LINE, label: 'Ligne' },
  ];

  const getMapToolIcon = (toolId) => {
    const tableStyle = { fill: '#fff', stroke: '#333', strokeWidth: 1.5 };
    const wallStyle = { fill: '#9ca3af', stroke: '#6b7280', strokeWidth: 1 };
    const greenStyle = { fill: '#22c55e', stroke: '#16a34a', strokeWidth: 1.5 };
    const iconSize = 24;
    const vb = `0 0 ${iconSize} ${iconSize}`;
    switch (toolId) {
      case TABLE_SQUARE:
        return (
          <svg className="salle-tool-icon-svg" viewBox={vb} width={iconSize} height={iconSize} aria-hidden>
            <rect x={4} y={4} width={16} height={16} rx={2} {...tableStyle} />
          </svg>
        );
      case TABLE_RECT:
        return (
          <svg className="salle-tool-icon-svg" viewBox={vb} width={iconSize} height={iconSize} aria-hidden>
            <rect x={2} y={6} width={20} height={12} rx={2} {...tableStyle} />
          </svg>
        );
      case TABLE_ROUND:
        return (
          <svg className="salle-tool-icon-svg" viewBox={vb} width={iconSize} height={iconSize} aria-hidden>
            <circle cx={12} cy={12} r={8} {...tableStyle} />
          </svg>
        );
      case WALL:
        return (
          <svg className="salle-tool-icon-svg" viewBox={vb} width={iconSize} height={iconSize} aria-hidden>
            <rect x={2} y={9} width={20} height={6} rx={1} {...wallStyle} />
          </svg>
        );
      case GREENERY_ROUND:
        return (
          <svg className="salle-tool-icon-svg" viewBox={vb} width={iconSize} height={iconSize} aria-hidden>
            <circle cx={12} cy={12} r={8} {...greenStyle} />
          </svg>
        );
      case GREENERY_LINE:
        return (
          <svg className="salle-tool-icon-svg" viewBox={vb} width={iconSize} height={iconSize} aria-hidden>
            <rect x={2} y={9} width={20} height={6} rx={2} {...greenStyle} />
          </svg>
        );
      default:
        return null;
    }
  };
  const dragStartRef = useRef(null);
  const elementStartPosRef = useRef(null);
  const justDraggedRef = useRef(false);
  const justClosedTableEditRef = useRef(false);
  const pendingTableNumberRef = useRef('');
  const DRAG_THRESHOLD = 5;
  const [pendingDragId, setPendingDragId] = useState(null);

  const getCoords = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getCoordsFromMouse = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const startDrag = useCallback((e, el) => {
    e.stopPropagation();
    if (selectedTool === ERASER_ELEMENT) return;
    if (el.tableNumber !== undefined && editingTableId === el.id) return;
    dragStartRef.current = getCoordsFromMouse(e.clientX, e.clientY);
    elementStartPosRef.current = getPositionSnapshot(el);
    setPendingDragId(el.id);
  }, [selectedTool, editingTableId, getCoordsFromMouse]);

  const handleDragMove = useCallback((e) => {
    if (!draggingElementId || !svgRef.current) return;
    const current = getCoordsFromMouse(e.clientX, e.clientY);
    const start = dragStartRef.current;
    if (!start) return;
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const startPos = elementStartPosRef.current;
    if (!startPos) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === draggingElementId ? applyDeltaToElement(el, startPos, dx, dy) : el
      )
    );
  }, [draggingElementId, getCoordsFromMouse]);

  const endDrag = useCallback(() => {
    if (draggingElementId) justDraggedRef.current = true;
    setDraggingElementId(null);
  }, [draggingElementId]);

  useEffect(() => {
    if (!draggingElementId) return;
    const onUp = () => endDrag();
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [draggingElementId, endDrag]);

  useEffect(() => {
    if (!pendingDragId) return;
    const onMove = (e) => {
      const start = dragStartRef.current;
      if (!start || !svgRef.current) return;
      const current = getCoordsFromMouse(e.clientX, e.clientY);
      const dx = current.x - start.x;
      const dy = current.y - start.y;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        setDraggingElementId(pendingDragId);
        setPendingDragId(null);
      }
    };
    const onUp = () => setPendingDragId(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pendingDragId, getCoordsFromMouse]);

  const drawingSegmentRef = useRef(null);
  drawingSegmentRef.current = drawingSegment;

  const endDrawingSegment = useCallback((endX, endY) => {
    const seg = drawingSegmentRef.current;
    setDrawingSegment(null);
    setLinePreview(null);
    if (!seg) return;
    const len = Math.hypot(endX - seg.start.x, endY - seg.start.y);
    if (len < 8) return;
    setElements((elts) => [
      ...elts,
      {
        id: generateId(),
        type: seg.tool,
        x1: seg.start.x,
        y1: seg.start.y,
        x2: endX,
        y2: endY,
      },
    ]);
  }, []);

  useEffect(() => {
    if (!drawingSegment) return;
    const onUp = (e) => {
      const end = getCoordsFromMouse(e.clientX, e.clientY);
      endDrawingSegment(end.x, end.y);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [drawingSegment, endDrawingSegment, getCoordsFromMouse]);

  const handleResetMap = useCallback(() => {
    setElements([]);
    setEditingTableId(null);
    setPendingTable(null);
    setDrawingSegment(null);
    setLinePreview(null);
    setShowResetModal(false);
  }, []);

  const handleCloseTableEdit = useCallback(() => {
    setEditingTableId(null);
    justClosedTableEditRef.current = true;
  }, []);

  const handleClosePendingTable = useCallback(() => {
    const num = String(pendingTableNumberRef.current ?? '').trim();
    if (pendingTable && num) {
      setElements((prev) => [
        ...prev,
        {
          ...pendingTable,
          id: generateId(),
          tableNumber: num,
        },
      ]);
    }
    pendingTableNumberRef.current = '';
    setPendingTable(null);
    justClosedTableEditRef.current = true;
  }, [pendingTable]);

  const handleCanvasClick = (e) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    if (justClosedTableEditRef.current) {
      justClosedTableEditRef.current = false;
      return;
    }
    if (selectedTool === ERASER_ELEMENT) return;
    if (selectedTool === WALL || selectedTool === GREENERY_LINE) return;
    if (editingTableId) {
      setEditingTableId(null);
      return;
    }
    if (pendingTable) {
      setPendingTable(null);
      return;
    }
    if (e.target.closest('g')) return;
    const { x, y } = getCoords(e);

    if (selectedTool === TABLE_SQUARE) {
      pendingTableNumberRef.current = '';
      setPendingTable({
        id: 'pending',
        type: TABLE_SQUARE,
        x: x - DEFAULT_TABLE_SIZE / 2,
        y: y - DEFAULT_TABLE_SIZE / 2,
        width: DEFAULT_TABLE_SIZE,
        height: DEFAULT_TABLE_SIZE,
        tableNumber: '',
      });
    } else if (selectedTool === TABLE_RECT) {
      pendingTableNumberRef.current = '';
      setPendingTable({
        id: 'pending',
        type: TABLE_RECT,
        x: x - 30,
        y: y - 22,
        width: 60,
        height: 44,
        tableNumber: '',
      });
    } else if (selectedTool === TABLE_ROUND) {
      pendingTableNumberRef.current = '';
      setPendingTable({
        id: 'pending',
        type: TABLE_ROUND,
        cx: x,
        cy: y,
        r: DEFAULT_TABLE_SIZE / 2,
        tableNumber: '',
      });
    } else if (selectedTool === GREENERY_ROUND) {
      setElements((prev) => [
        ...prev,
        {
          id: generateId(),
          type: GREENERY_ROUND,
          cx: x,
          cy: y,
          r: GREENERY_RADIUS,
        },
      ]);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (draggingElementId) return;
    if (selectedTool !== WALL && selectedTool !== GREENERY_LINE) return;
    if (e.target.closest('g')) return;
    const { x, y } = getCoords(e);
    setDrawingSegment({ start: { x, y }, tool: selectedTool });
  };

  const handleCanvasMouseMove = (e) => {
    if (draggingElementId) {
      handleDragMove(e);
      return;
    }
    const pt = getCoords(e);
    if (drawingSegment) setLinePreview(pt);
  };

  const handleCanvasMouseLeave = () => {
    setLinePreview(null);
    if (drawingSegment) setDrawingSegment(null);
  };

  const handleTableDoubleClick = (e, el) => {
    e.stopPropagation();
    if (el.type === TABLE_SQUARE || el.type === TABLE_RECT || el.type === TABLE_ROUND) setEditingTableId(el.id);
  };

  const handleTableNumberChange = (id, value) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, tableNumber: value === '' ? '' : value } : el))
    );
  };

  const handleDeleteSelected = () => {
    if (!editingTableId) return;
    setElements((prev) => prev.filter((el) => el.id !== editingTableId));
    setEditingTableId(null);
  };

  const handleDeleteElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (editingTableId === id) setEditingTableId(null);
  }, [editingTableId]);

  const fetchMaps = useCallback(async () => {
    setMapsLoading(true);
    setMapsError(null);
    try {
      const { data } = await axios.get(API_MAPS);
      setSavedMaps(data);
    } catch (err) {
      setMapsError(err.response?.data?.detail || err.message || 'Erreur');
    } finally {
      setMapsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const handleNewMap = useCallback(() => {
    setCurrentMapId(null);
    setCurrentMapName('');
    setElements([]);
    setEditingTableId(null);
    setPendingTable(null);
  }, []);

  const handleLoadMap = useCallback(async (id) => {
    setMapsError(null);
    try {
      const { data } = await axios.get(`${API_MAPS}${id}/`);
      setElements(Array.isArray(data.elements) ? data.elements : []);
      setCurrentMapId(data.id);
      setCurrentMapName(data.name || '');
      setEditingTableId(null);
      setPendingTable(null);
    } catch (err) {
      setMapsError(err.response?.data?.detail || err.message || 'Erreur');
    }
  }, []);

  const handleSaveMap = useCallback(async () => {
    if (currentMapId) {
      setMapsError(null);
      try {
        await axios.put(`${API_MAPS}${currentMapId}/`, {
          name: currentMapName || 'Sans titre',
          elements,
        });
        fetchMaps();
      } catch (err) {
        setMapsError(err.response?.data?.detail || err.message || 'Erreur');
      }
      return;
    }
    setSaveNameInput(currentMapName || '');
    setShowSaveModal(true);
  }, [currentMapId, currentMapName, elements, fetchMaps]);

  const handleSaveNewConfirm = useCallback(async () => {
    const name = (saveNameInput || '').trim() || 'Sans titre';
    setMapsError(null);
    try {
      const { data } = await axios.post(API_MAPS, { name, elements });
      setCurrentMapId(data.id);
      setCurrentMapName(data.name);
      setShowSaveModal(false);
      setSaveNameInput('');
      fetchMaps();
    } catch (err) {
      setMapsError(err.response?.data?.detail || err.message || 'Erreur');
    }
  }, [saveNameInput, elements, fetchMaps]);

  const handleDeleteMap = useCallback(async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer cette carte ?')) return;
    setMapsError(null);
    try {
      await axios.delete(`${API_MAPS}${id}/`);
      if (currentMapId === id) {
        setCurrentMapId(null);
        setCurrentMapName('');
        setElements([]);
        setEditingTableId(null);
        setPendingTable(null);
      }
      fetchMaps();
    } catch (err) {
      setMapsError(err.response?.data?.detail || err.message || 'Erreur');
    }
  }, [currentMapId, fetchMaps]);

  const handleExport = useCallback(() => {
    const name = (currentMapName || 'carte').trim() || 'carte';
    const MAP_W = 800;
    const MAP_H = 600;
    const PDF_W = 297;
    const PDF_H = 210;
    const scale = Math.min(PDF_W / MAP_W, PDF_H / MAP_H);
    const drawW = MAP_W * scale;
    const drawH = MAP_H * scale;
    const offsetX = (PDF_W - drawW) / 2;
    const offsetY = (PDF_H - drawH) / 2;
    const toPdf = (x, y) => [offsetX + x * scale, offsetY + y * scale];

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(250, 250, 250);
    doc.rect(offsetX, offsetY, drawW, drawH, 'F');
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.1);
    const gridStep = 20;
    for (let gx = 0; gx <= MAP_W; gx += gridStep) {
      const [x1, y1] = toPdf(gx, 0);
      const [x2, y2] = toPdf(gx, MAP_H);
      doc.line(x1, y1, x2, y2);
    }
    for (let gy = 0; gy <= MAP_H; gy += gridStep) {
      const [x1, y1] = toPdf(0, gy);
      const [x2, y2] = toPdf(MAP_W, gy);
      doc.line(x1, y1, x2, y2);
    }

    elements.forEach((el) => {
      if (el.type === TABLE_SQUARE || el.type === TABLE_RECT) {
        const [x, y] = toPdf(el.x, el.y);
        const w = el.width * scale;
        const h = el.height * scale;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.4);
        doc.roundedRect(x, y, w, h, 1, 1, 'FD');
        const label = el.tableNumber !== undefined && el.tableNumber !== '' ? String(el.tableNumber) : '';
        if (label) {
          doc.setFontSize(10);
          doc.setTextColor(51, 51, 51);
          doc.text(label, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
        }
      } else if (el.type === TABLE_ROUND) {
        const [cx, cy] = toPdf(el.cx, el.cy);
        const r = el.r * scale;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(51, 51, 51);
        doc.setLineWidth(0.4);
        doc.circle(cx, cy, r, 'FD');
        const label = el.tableNumber !== undefined && el.tableNumber !== '' ? String(el.tableNumber) : '';
        if (label) {
          doc.setFontSize(10);
          doc.setTextColor(51, 51, 51);
          doc.text(label, cx, cy, { align: 'center', baseline: 'middle' });
        }
      } else if (el.type === WALL) {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = (-dy / len) * (WALL_THICKNESS / 2);
        const uy = (dx / len) * (WALL_THICKNESS / 2);
        const pts = [
          [el.x1 + ux, el.y1 + uy],
          [el.x2 + ux, el.y2 + uy],
          [el.x2 - ux, el.y2 - uy],
          [el.x1 - ux, el.y1 - uy],
        ].map(([px, py]) => toPdf(px, py));
        doc.setFillColor(156, 163, 175);
        doc.setDrawColor(107, 114, 128);
        doc.setLineWidth(0.2);
        const wallPath = [
          { op: 'm', c: [pts[0][0], pts[0][1]] },
          { op: 'l', c: [pts[1][0], pts[1][1]] },
          { op: 'l', c: [pts[2][0], pts[2][1]] },
          { op: 'l', c: [pts[3][0], pts[3][1]] },
          { op: 'h', c: [] },
        ];
        doc.path(wallPath).fill().stroke();
      } else if (el.type === GREENERY_LINE) {
        const dx = el.x2 - el.x1;
        const dy = el.y2 - el.y1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = (-dy / len) * (GREENERY_THICKNESS / 2);
        const uy = (dx / len) * (GREENERY_THICKNESS / 2);
        const pts = [
          [el.x1 + ux, el.y1 + uy],
          [el.x2 + ux, el.y2 + uy],
          [el.x2 - ux, el.y2 - uy],
          [el.x1 - ux, el.y1 - uy],
        ].map(([px, py]) => toPdf(px, py));
        doc.setFillColor(34, 197, 94);
        doc.setDrawColor(22, 163, 74);
        doc.setLineWidth(0.2);
        const greenPath = [
          { op: 'm', c: [pts[0][0], pts[0][1]] },
          { op: 'l', c: [pts[1][0], pts[1][1]] },
          { op: 'l', c: [pts[2][0], pts[2][1]] },
          { op: 'l', c: [pts[3][0], pts[3][1]] },
          { op: 'h', c: [] },
        ];
        doc.path(greenPath).fill().stroke();
      } else if (el.type === GREENERY_ROUND) {
        const [cx, cy] = toPdf(el.cx, el.cy);
        const r = el.r * scale;
        doc.setFillColor(34, 197, 94);
        doc.setDrawColor(22, 163, 74);
        doc.setLineWidth(0.4);
        doc.circle(cx, cy, r, 'FD');
      }
    });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(name, offsetX, offsetY + 6);
    doc.save(`${name.replace(/\s+/g, '_')}.pdf`);
  }, [currentMapName, elements]);

  const otherTools = [{ id: WALL, label: 'Mur' }];

  return (
    <div className="salle-page">
      <div className="salle-editor-layout">
        <div className="salle-editor-side">
      <div className="salle-hint-row">
        <span className="salle-hint">
          {draggingElementId
            ? 'Déplacez l\'élément puis relâchez.'
            : selectedTool === ERASER_ELEMENT
            ? 'Cliquez sur un élément (table, mur, verdure) pour le supprimer.'
            : selectedTool === WALL
            ? 'Maintenez le bouton enfoncé et glissez pour tracer un segment de mur.'
            : selectedTool === GREENERY_ROUND
            ? 'Cliquez sur la carte pour placer un rond de verdure.'
            : selectedTool === GREENERY_LINE
            ? 'Maintenez le bouton enfoncé et glissez pour tracer un segment de verdure.'
            : 'Cliquez sur la carte pour placer un élément. Une table n\'est enregistrée qu\'après avoir saisi son numéro (Entrée ou clic ailleurs). Double-cliquez sur une table pour modifier son numéro.'}
        </span>
      </div>
      <div className="salle-toolbar">
        <div className="salle-toolbar-section">
          <div className="salle-toolbar-section-title">Tables</div>
          {tableTools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`salle-tool ${selectedTool === t.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedTool(t.id);
                setLinePreview(null);
                setDrawingSegment(null);
              }}
              title={t.label}
            >
              <span className="salle-tool-icon">{getMapToolIcon(t.id)}</span>
              <span className="salle-tool-label">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="salle-toolbar-section">
          <div className="salle-toolbar-section-title">Murs</div>
          {otherTools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`salle-tool ${selectedTool === t.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedTool(t.id);
                setLinePreview(null);
                setDrawingSegment(null);
              }}
              title={t.label}
            >
              <span className="salle-tool-icon">{getMapToolIcon(t.id)}</span>
              <span className="salle-tool-label">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="salle-toolbar-section">
          <div className="salle-toolbar-section-title">Verdure</div>
          {greeneryTools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`salle-tool ${selectedTool === t.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedTool(t.id);
                setLinePreview(null);
                setDrawingSegment(null);
              }}
              title={t.label}
            >
              <span className="salle-tool-icon">{getMapToolIcon(t.id)}</span>
              <span className="salle-tool-label">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="salle-toolbar-section">
          <div className="salle-toolbar-section-title">Effacer</div>
          <button
            type="button"
            className={`salle-tool salle-tool--danger ${selectedTool === ERASER_ELEMENT ? 'active' : ''}`}
            onClick={() => {
              setSelectedTool(ERASER_ELEMENT);
              setLinePreview(null);
              setDrawingSegment(null);
            }}
            title="Cliquez sur un élément de la carte pour le supprimer"
          >
            <span className="salle-tool-icon">✏️</span>
            <span className="salle-tool-label">Un élément</span>
          </button>
          <button
            type="button"
            className="salle-tool salle-tool--danger"
            onClick={() => setShowResetModal(true)}
            title="Effacer toute la carte"
          >
            <span className="salle-tool-icon">🗑️</span>
            <span className="salle-tool-label">Toute la carte</span>
          </button>
        </div>
      </div>
      <div className="salle-maps-panel">
        <div className="salle-maps-panel-title">Mes cartes</div>
        {currentMapName && (
          <div className="salle-current-map-name" title="Carte ouverte">
            {currentMapName}
          </div>
        )}
        {mapsError && <div className="salle-maps-error">{mapsError}</div>}
        <div className="salle-maps-actions">
          <button type="button" className="salle-tool salle-maps-btn" onClick={handleNewMap} title="Nouvelle carte">
            <span className="salle-tool-icon">📄</span>
            <span className="salle-tool-label">Nouvelle</span>
          </button>
          <button type="button" className="salle-tool salle-maps-btn" onClick={handleSaveMap} title="Enregistrer">
            <span className="salle-tool-icon">💾</span>
            <span className="salle-tool-label">Enregistrer</span>
          </button>
          <button type="button" className="salle-tool salle-maps-btn" onClick={handleExport} title="Exporter en PDF">
            <span className="salle-tool-icon">📤</span>
            <span className="salle-tool-label">Exporter</span>
          </button>
        </div>
        <div className="salle-maps-list">
          {mapsLoading ? (
            <div className="salle-maps-loading">Chargement…</div>
          ) : savedMaps.length === 0 ? (
            <div className="salle-maps-empty">Aucune carte enregistrée</div>
          ) : (
            savedMaps.map((m) => (
              <div
                key={m.id}
                className={`salle-maps-item ${currentMapId === m.id ? 'active' : ''}`}
                onClick={() => handleLoadMap(m.id)}
              >
                <span className="salle-maps-item-name">{m.name}</span>
                <button
                  type="button"
                  className="salle-maps-item-delete"
                  onClick={(e) => handleDeleteMap(m.id, e)}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
        </div>
      <div className="salle-canvas-wrap">
        <svg
          ref={svgRef}
          className={`salle-canvas ${selectedTool === ERASER_ELEMENT ? 'salle-canvas--eraser' : ''} ${draggingElementId ? 'salle-canvas--dragging' : ''}`}
          viewBox="0 0 800 600"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        >
          <defs>
            <pattern id="salle-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e5e5" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="600" fill="#fafafa" />
          <rect width="800" height="600" fill="url(#salle-grid)" />

          {(pendingTable ? [...elements, pendingTable] : elements).map((el) => {
            if (el.type === TABLE_SQUARE || el.type === TABLE_RECT) {
              const isPending = el.id === 'pending';
              const showInput = editingTableId === el.id || isPending;
              return (
                <g
                  key={el.id}
                  onMouseDown={(e) => { if (!isPending) startDrag(e, el); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedTool === ERASER_ELEMENT) {
                      if (isPending) setPendingTable(null);
                      else handleDeleteElement(el.id);
                    }
                  }}
                  onDoubleClick={(e) => { if (!isPending) handleTableDoubleClick(e, el); }}
                  className={`${selectedTool === ERASER_ELEMENT ? 'salle-element-clickable' : ''} ${!isPending && selectedTool !== ERASER_ELEMENT && editingTableId !== el.id ? 'salle-element-draggable' : ''}`}
                >
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    className="salle-table-rect"
                    rx="4"
                  />
                  {showInput ? (
                    <foreignObject x={el.x} y={el.y} width={el.width} height={el.height}>
                      <input
                        type="text"
                        className="salle-table-input"
                        placeholder="N°"
                        value={isPending ? (pendingTable?.tableNumber ?? '') : (el.tableNumber ?? '')}
                        onChange={(e) => {
                          if (isPending) {
                            pendingTableNumberRef.current = e.target.value;
                            setPendingTable((p) => ({ ...p, tableNumber: e.target.value }));
                          } else handleTableNumberChange(el.id, e.target.value);
                        }}
                        onBlur={isPending ? handleClosePendingTable : handleCloseTableEdit}
                        onKeyDown={(e) => { if (e.key === 'Enter') (isPending ? handleClosePendingTable : handleCloseTableEdit)(); }}
                        autoFocus
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={el.x + el.width / 2}
                      y={el.y + el.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="salle-table-number"
                    >
                      {el.tableNumber ?? ''}
                    </text>
                  )}
                </g>
              );
            }
            if (el.type === TABLE_ROUND) {
              const isPending = el.id === 'pending';
              const showInput = editingTableId === el.id || isPending;
              return (
                <g
                  key={el.id}
                  onMouseDown={(e) => { if (!isPending) startDrag(e, el); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedTool === ERASER_ELEMENT) {
                      if (isPending) setPendingTable(null);
                      else handleDeleteElement(el.id);
                    }
                  }}
                  onDoubleClick={(e) => { if (!isPending) handleTableDoubleClick(e, el); }}
                  className={`${selectedTool === ERASER_ELEMENT ? 'salle-element-clickable' : ''} ${!isPending && selectedTool !== ERASER_ELEMENT && editingTableId !== el.id ? 'salle-element-draggable' : ''}`}
                >
                  <circle
                    cx={el.cx}
                    cy={el.cy}
                    r={el.r}
                    className="salle-table-round"
                  />
                  {showInput ? (
                    <foreignObject
                      x={el.cx - el.r}
                      y={el.cy - el.r}
                      width={el.r * 2}
                      height={el.r * 2}
                    >
                      <input
                        type="text"
                        className="salle-table-input salle-table-input--round"
                        placeholder="N°"
                        value={isPending ? (pendingTable?.tableNumber ?? '') : (el.tableNumber ?? '')}
                        onChange={(e) => {
                          if (isPending) {
                            pendingTableNumberRef.current = e.target.value;
                            setPendingTable((p) => ({ ...p, tableNumber: e.target.value }));
                          } else handleTableNumberChange(el.id, e.target.value);
                        }}
                        onBlur={isPending ? handleClosePendingTable : handleCloseTableEdit}
                        onKeyDown={(e) => { if (e.key === 'Enter') (isPending ? handleClosePendingTable : handleCloseTableEdit)(); }}
                        autoFocus
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x={el.cx}
                      y={el.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="salle-table-number"
                    >
                      {el.tableNumber ?? ''}
                    </text>
                  )}
                </g>
              );
            }
            if (el.type === WALL) {
              return (
                <g
                  key={el.id}
                  onMouseDown={(e) => startDrag(e, el)}
                  onClick={(e) => { e.stopPropagation(); if (selectedTool === ERASER_ELEMENT) handleDeleteElement(el.id); }}
                  className={`${selectedTool === ERASER_ELEMENT ? 'salle-element-clickable' : ''} ${selectedTool !== ERASER_ELEMENT ? 'salle-element-draggable' : ''}`}
                >
                  {(() => {
              const dx = el.x2 - el.x1;
              const dy = el.y2 - el.y1;
              const len = Math.hypot(dx, dy) || 1;
              const ux = (-dy / len) * (WALL_THICKNESS / 2);
              const uy = (dx / len) * (WALL_THICKNESS / 2);
              const points = [
                [el.x1 + ux, el.y1 + uy],
                [el.x2 + ux, el.y2 + uy],
                [el.x2 - ux, el.y2 - uy],
                [el.x1 - ux, el.y1 - uy],
              ];
              return (
                <polygon
                  points={points.map(([a, b]) => `${a},${b}`).join(' ')}
                  className="salle-wall"
                />
              );
                  })()}
                </g>
              );
            }
            if (el.type === GREENERY_LINE) {
              const dx = el.x2 - el.x1;
              const dy = el.y2 - el.y1;
              const len = Math.hypot(dx, dy) || 1;
              const ux = (-dy / len) * (GREENERY_THICKNESS / 2);
              const uy = (dx / len) * (GREENERY_THICKNESS / 2);
              const points = [
                [el.x1 + ux, el.y1 + uy],
                [el.x2 + ux, el.y2 + uy],
                [el.x2 - ux, el.y2 - uy],
                [el.x1 - ux, el.y1 - uy],
              ];
              return (
                <g
                  key={el.id}
                  onMouseDown={(e) => startDrag(e, el)}
                  onClick={(e) => { e.stopPropagation(); if (selectedTool === ERASER_ELEMENT) handleDeleteElement(el.id); }}
                  className={`${selectedTool === ERASER_ELEMENT ? 'salle-element-clickable' : ''} ${selectedTool !== ERASER_ELEMENT ? 'salle-element-draggable' : ''}`}
                >
                  <polygon
                    points={points.map(([a, b]) => `${a},${b}`).join(' ')}
                    className="salle-greenery-line"
                  />
                </g>
              );
            }
            if (el.type === GREENERY_ROUND) {
              return (
                <g
                  key={el.id}
                  onMouseDown={(e) => startDrag(e, el)}
                  onClick={(e) => { e.stopPropagation(); if (selectedTool === ERASER_ELEMENT) handleDeleteElement(el.id); }}
                  className={`${selectedTool === ERASER_ELEMENT ? 'salle-element-clickable' : ''} ${selectedTool !== ERASER_ELEMENT ? 'salle-element-draggable' : ''}`}
                >
                  <circle
                    cx={el.cx}
                    cy={el.cy}
                    r={el.r}
                    className="salle-greenery-round"
                  />
                </g>
              );
            }
            return null;
          })}

          {drawingSegment && linePreview && (
            drawingSegment.tool === WALL ? (
              <line
                x1={drawingSegment.start.x}
                y1={drawingSegment.start.y}
                x2={linePreview.x}
                y2={linePreview.y}
                className="salle-wall-preview"
                strokeWidth={WALL_THICKNESS}
              />
            ) : (
              <line
                x1={drawingSegment.start.x}
                y1={drawingSegment.start.y}
                x2={linePreview.x}
                y2={linePreview.y}
                className="salle-greenery-preview"
                strokeWidth={GREENERY_THICKNESS}
              />
            )
          )}
        </svg>
      </div>
      </div>
      {editingTableId && (
        <div className="salle-edit-actions">
          <button type="button" className="salle-delete-btn" onClick={handleDeleteSelected}>
            Supprimer la table
          </button>
        </div>
      )}

      {showResetModal && (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="salle-reset-title">
          <div className="auth-modal">
            <h3 id="salle-reset-title" className="auth-modal-title">Effacer la carte</h3>
            <p className="auth-modal-text">
              Toutes les modifications (tables, murs, verdure) seront supprimées. Cette action est irréversible.
            </p>
            <div className="auth-modal-actions">
              <button type="button" className="auth-modal-btn auth-modal-btn--secondary" onClick={() => setShowResetModal(false)}>
                Annuler
              </button>
              <button type="button" className="auth-modal-btn auth-modal-btn--danger" onClick={handleResetMap}>
                Effacer tout
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="salle-save-title">
          <div className="auth-modal">
            <h3 id="salle-save-title" className="auth-modal-title">Enregistrer la carte</h3>
            <p className="auth-modal-text">Donnez un nom à cette carte.</p>
            <input
              type="text"
              className="auth-input salle-save-input"
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              placeholder="Nom de la carte"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveNewConfirm()}
            />
            <div className="auth-modal-actions">
              <button type="button" className="auth-modal-btn auth-modal-btn--secondary" onClick={() => { setShowSaveModal(false); setSaveNameInput(''); }}>
                Annuler
              </button>
              <button type="button" className="auth-modal-btn auth-modal-btn--primary" onClick={handleSaveNewConfirm}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
