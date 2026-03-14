import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Pencil, Eraser, Type, Save, Trash2, Plus, Minus, Map, Gamepad2, Upload, Download, X, CheckCircle
} from 'lucide-react'
import { loadState, saveState, getActiveGame, getActiveMap, generateId } from './storage.js'
import { CANVAS_W, CANVAS_H, drawGrid, useDrawCanvas } from './useCanvas.js'

// ─── Annotation Label ──────────────────────────────────────────────────────────
function AnnotationLabel({ ann, index, onDelete, canvasW, canvasH }) {
  const x = ann.x * canvasW
  const y = ann.y * canvasH
  return (
    <div
      className="absolute select-none pointer-events-auto"
      style={{ left: x, top: y, transform: 'translate(-50%, -100%)', marginTop: -6 }}
    >
      <div
        className="relative flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg"
        style={{
          background: 'rgba(10,12,20,0.88)',
          border: `1.5px solid ${ann.color || '#f97316'}`,
          color: '#f1f5f9',
          fontFamily: "'DM Mono', monospace",
          backdropFilter: 'blur(4px)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: ann.color || '#f97316' }}
        />
        {ann.text}
        <button
          className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
          onClick={() => onDelete(index)}
          title="削除"
        >
          <X size={10} />
        </button>
      </div>
      {/* Stem */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-px h-2"
        style={{ background: ann.color || '#f97316', bottom: -8 }}
      />
    </div>
  )
}

// ─── Sidebar Map Item ─────────────────────────────────────────────────────────
function MapItem({ map, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-all rounded mx-1 my-0.5 ${
        active
          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 border border-transparent'
      }`}
      style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}
    >
      <Map size={12} className="flex-shrink-0" />
      <span className="truncate">{map.name}</span>
    </button>
  )
}

// ─── Tool Button ──────────────────────────────────────────────────────────────
function ToolBtn({ icon: Icon, label, active, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all border ${
        danger
          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
          : active
          ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-300'
          : 'border-slate-600/50 text-slate-400 hover:bg-slate-700/60 hover:text-slate-300'
      }`}
    >
      <Icon size={16} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{label}</span>
    </button>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(() => loadState())
  const [tool, setTool]   = useState('pen')
  const [color, setColor] = useState('#f97316')
  const [size, setSize]   = useState(4)
  const [saved, setSaved] = useState(true)
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: '' })

  // Keep a ref to active map for canvas callbacks
  const activeMapRef = useRef(getActiveMap(state))
  useEffect(() => { activeMapRef.current = getActiveMap(state) }, [state])

  const { bgCanvasRef, drawCanvasRef, isDrawing, lastPos, renderBg, renderDraw, getDrawData, clearDraw } =
    useDrawCanvas(activeMapRef)

  // Re-render canvas layers when active map changes
  useEffect(() => {
    renderBg()
    renderDraw()
  }, [state.active_map, state.active_game, renderBg, renderDraw])

  // Also re-render bg when image_data changes
  useEffect(() => {
    renderBg()
  }, [getActiveMap(state)?.image_data, renderBg])

  // ── Drawing ──────────────────────────────────────────────────────────────────
  const getPos = (e) => {
    const rect = drawCanvasRef.current.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    }
  }

  // Overlay click handler used only in text mode
  const handleTextOverlayClick = (e) => {
    if (tool !== 'text') return
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top)  * scaleY
    setTextInput({ visible: true, x, y, value: '' })
  }

  const handleMouseDown = (e) => {
    // text mode is handled by the overlay, not this canvas
    if (tool === 'text') return
    isDrawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    const ctx = drawCanvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return
    const pos  = getPos(e)
    const ctx  = drawCanvasRef.current.getContext('2d')
    ctx.lineCap    = 'round'
    ctx.lineJoin   = 'round'
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth  = size * 5
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth   = size
    }
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    lastPos.current = pos
    setSaved(false)
  }

  const handleMouseUp = () => {
    isDrawing.current = false
    const ctx = drawCanvasRef.current?.getContext('2d')
    if (ctx) ctx.globalCompositeOperation = 'source-over'
  }

  // ── Text placement ────────────────────────────────────────────────────────────
  const confirmText = useCallback(() => {
    const { x, y, value } = textInput
    if (!value.trim()) { setTextInput(t => ({ ...t, visible: false })); return }
    setState(prev => {
      const next = structuredClone(prev)
      const map  = getActiveMap(next)
      if (!map) return prev
      map.annotations.push({
        x: x / CANVAS_W,
        y: y / CANVAS_H,
        text: value.trim(),
        color,
      })
      return next
    })
    setTextInput({ visible: false, x: 0, y: 0, value: '' })
    setSaved(false)
  }, [textInput, color])

  // ── Image upload ──────────────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setState(prev => {
        const next = structuredClone(prev)
        const map  = getActiveMap(next)
        if (map) map.image_data = ev.target.result
        return next
      })
      setSaved(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = () => {
    setState(prev => {
      const next = structuredClone(prev)
      const map  = getActiveMap(next)
      if (map) map.image_data = null
      return next
    })
    setSaved(false)
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    setState(prev => {
      const next = structuredClone(prev)
      const map  = getActiveMap(next)
      if (map) map.canvas_data = getDrawData()
      saveState(next)
      return next
    })
    setSaved(true)
  }

  // ── Export JSON ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    // 現在の手書きデータも含めて書き出す
    const exportData = structuredClone(state)
    const map = getActiveMap(exportData)
    if (map) map.canvas_data = getDrawData()
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `gamemap_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import JSON ───────────────────────────────────────────────────────────────
  const importInputRef = useRef(null)

  const handleImportClick = () => importInputRef.current?.click()

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        // 最低限のバリデーション
        if (!parsed.games || typeof parsed.games !== 'object') throw new Error('invalid')
        // active_game / active_map が存在しない場合は補完
        const gameIds = Object.keys(parsed.games)
        if (!parsed.active_game || !parsed.games[parsed.active_game]) {
          parsed.active_game = gameIds[0]
        }
        const firstMap = parsed.games[parsed.active_game]?.maps?.[0]
        if (!parsed.active_map || !parsed.games[parsed.active_game]?.maps?.find(m => m.id === parsed.active_map)) {
          parsed.active_map = firstMap?.id ?? ''
        }
        setState(parsed)
        saveState(parsed)
        setSaved(true)
      } catch {
        alert('JSONの読み込みに失敗しました。形式を確認してください。')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Clear ─────────────────────────────────────────────────────────────────────
  const handleClear = () => {
    clearDraw()
    setState(prev => {
      const next = structuredClone(prev)
      const map  = getActiveMap(next)
      if (map) { map.canvas_data = null; map.annotations = [] }
      return next
    })
    setSaved(false)
  }

  const deleteAnnotation = (idx) => {
    setState(prev => {
      const next = structuredClone(prev)
      const map  = getActiveMap(next)
      if (map) map.annotations.splice(idx, 1)
      return next
    })
    setSaved(false)
  }

  // ── Game / Map management ─────────────────────────────────────────────────────
  const addGame = () => {
    const title = window.prompt('ゲーム名を入力:')
    if (!title?.trim()) return
    const gid = 'game_' + generateId()
    const mid = 'map_'  + generateId()
    setState(prev => {
      const next = structuredClone(prev)
      next.games[gid] = {
        title: title.trim(),
        maps: [{ id: mid, name: 'マップ 1', image_data: null, canvas_data: null, annotations: [] }],
      }
      next.active_game = gid
      next.active_map  = mid
      return next
    })
    setSaved(false)
  }

  const addMap = () => {
    const name = window.prompt('マップ名を入力:')
    if (!name?.trim()) return
    const mid = 'map_' + generateId()
    setState(prev => {
      const next = structuredClone(prev)
      const game = next.games[next.active_game]
      if (game) {
        game.maps.push({ id: mid, name: name.trim(), image_data: null, canvas_data: null, annotations: [] })
        next.active_map = mid
      }
      return next
    })
    setSaved(false)
  }

  const deleteGame = () => {
    const gameIds = Object.keys(state.games)
    if (gameIds.length <= 1) { alert('最後のゲームは削除できません'); return }
    if (!window.confirm(`「${state.games[state.active_game]?.title}」を削除しますか？`)) return
    setState(prev => {
      const next = structuredClone(prev)
      delete next.games[next.active_game]
      const remaining = Object.keys(next.games)
      next.active_game = remaining[0]
      next.active_map  = next.games[remaining[0]]?.maps[0]?.id ?? ''
      return next
    })
    setSaved(false)
  }

  const deleteMap = () => {
    const game = getActiveGame(state)
    if (!game) return
    if (game.maps.length <= 1) { alert('最後のマップは削除できません'); return }
    if (!window.confirm(`「${getActiveMap(state)?.name}」を削除しますか？`)) return
    setState(prev => {
      const next  = structuredClone(prev)
      const g     = next.games[next.active_game]
      const idx   = g.maps.findIndex(m => m.id === next.active_map)
      g.maps.splice(idx, 1)
      next.active_map = g.maps[Math.max(0, idx - 1)].id
      return next
    })
    setSaved(false)
  }

  const switchGame = (id) => {
    setState(prev => {
      const next  = structuredClone(prev)
      next.active_game = id
      next.active_map  = next.games[id]?.maps[0]?.id ?? ''
      return next
    })
  }

  const switchMap = (id) => {
    setState(prev => ({ ...prev, active_map: id }))
  }

  const activeGame = getActiveGame(state)
  const activeMap  = getActiveMap(state)

  // Cursor style for canvas
  const cursorStyle = tool === 'text' ? 'text' : tool === 'eraser' ? 'cell' : 'crosshair'

  // ── Canvas rect for text input positioning ────────────────────────────────────
  const canvasWrapperRef = useRef(null)

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0d0f14', fontFamily: "'Syne', sans-serif" }}>

      {/* ── HEADER ── */}
      <header
        className="flex items-center gap-2 px-4 border-b flex-shrink-0"
        style={{ height: 44, background: '#111520', borderColor: '#1e2436' }}
      >
        <div className="flex items-center gap-2 mr-4">
          <Gamepad2 size={16} className="text-indigo-400" />
          <span className="text-sm font-semibold tracking-wider text-slate-300" style={{ letterSpacing: '0.08em' }}>
            GAMEMAP
          </span>
          <span className="text-xs text-slate-600 font-mono">vibe annotator</span>
        </div>

        <div className="flex items-center gap-1">
          {Object.entries(state.games).map(([id, g]) => (
            <button
              key={id}
              onClick={() => switchGame(id)}
              className={`px-3 py-1 rounded text-xs transition-all ${
                id === state.active_game
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-600'
              }`}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {g.title}
            </button>
          ))}
          <button
            onClick={addGame}
            className="ml-1 px-2 py-1 rounded text-xs text-slate-600 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-400 transition-all"
          >
            <Plus size={10} className="inline" /> Game
          </button>
          <button
            onClick={deleteGame}
            className="px-2 py-1 rounded text-xs text-slate-600 border border-dashed border-slate-700 hover:border-red-500/50 hover:text-red-400 transition-all"
            title="アクティブなゲームを削除"
          >
            <Minus size={10} className="inline" /> Game
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {saved
            ? <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle size={12} /> 保存済み</span>
            : <span className="text-xs text-amber-500">未保存</span>
          }
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside
          className="flex flex-col flex-shrink-0 border-r"
          style={{ width: 168, background: '#0e1118', borderColor: '#1e2436' }}
        >
          <div
            className="px-3 py-2 text-xs font-semibold tracking-widest border-b"
            style={{ color: '#4b5675', borderColor: '#1e2436', letterSpacing: '0.12em' }}
          >
            MAPS
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {activeGame?.maps.map(m => (
              <MapItem
                key={m.id}
                map={m}
                active={m.id === state.active_map}
                onClick={() => switchMap(m.id)}
              />
            ))}
          </div>
          <div className="p-2 border-t flex flex-col gap-1" style={{ borderColor: '#1e2436' }}>
            <button
              onClick={addMap}
              className="w-full py-1.5 rounded text-xs text-slate-500 border border-dashed border-slate-700 hover:border-slate-500 hover:text-slate-400 transition-all flex items-center justify-center gap-1"
            >
              <Plus size={10} /> マップ追加
            </button>
            <button
              onClick={deleteMap}
              className="w-full py-1.5 rounded text-xs text-slate-600 border border-dashed border-slate-700 hover:border-red-500/50 hover:text-red-400 transition-all flex items-center justify-center gap-1"
            >
              <Minus size={10} /> マップ削除
            </button>
          </div>
        </aside>

        {/* ── MAIN AREA ── */}
        <main className="flex flex-col flex-1 overflow-hidden">

          {/* Image upload bar */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 border-b flex-shrink-0"
            style={{ background: '#0e1118', borderColor: '#1e2436' }}
          >
            <label
              className="flex items-center gap-2 px-3 py-1 rounded text-xs cursor-pointer transition-all border"
              style={{
                background: '#1a1d2e',
                borderColor: '#2d3358',
                color: '#94a3b8',
              }}
            >
              <Upload size={12} />
              画像を選択
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            {activeMap?.image_data ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={11} /> 画像読込済み
                </span>
                <button
                  onClick={removeImage}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <X size={11} /> 削除
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-600">画像なし（グリッド表示）</span>
            )}
            <div className="ml-auto text-xs text-slate-700" style={{ fontFamily: "'DM Mono', monospace" }}>
              {activeMap?.name}
            </div>
          </div>

          {/* Canvas */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden"
            style={{ background: '#080a10' }}
          >
            <div
              ref={canvasWrapperRef}
              className="relative"
              style={{ width: CANVAS_W, height: CANVAS_H }}
            >
              {/* Layer 1: Background */}
              <canvas
                ref={bgCanvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="absolute top-0 left-0"
              />

              {/* Layer 2: Freehand drawing — pointerEvents off in text mode */}
              <canvas
                ref={drawCanvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="absolute top-0 left-0"
                style={{
                  cursor: cursorStyle,
                  pointerEvents: tool === 'text' ? 'none' : 'auto',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />

              {/* Layer 3: Text annotations (HTML overlay) */}
              <div
                className="absolute top-0 left-0"
                style={{
                  width: CANVAS_W,
                  height: CANVAS_H,
                  pointerEvents: 'none',
                }}
              >
                {activeMap?.annotations.map((ann, i) => (
                  <AnnotationLabel
                    key={i}
                    ann={ann}
                    index={i}
                    onDelete={deleteAnnotation}
                    canvasW={CANVAS_W}
                    canvasH={CANVAS_H}
                  />
                ))}
              </div>

              {/* Text mode click overlay — sits on top, only active in text mode */}
              {tool === 'text' && (
                <div
                  className="absolute top-0 left-0"
                  style={{
                    width: CANVAS_W,
                    height: CANVAS_H,
                    cursor: 'text',
                    zIndex: 10,
                  }}
                  onClick={handleTextOverlayClick}
                />
              )}

              {/* Text input overlay */}
              {textInput.visible && (
                <input
                  autoFocus
                  className="absolute rounded outline-none"
                  style={{
                    left: textInput.x,
                    top:  Math.max(0, textInput.y - 36),
                    minWidth: 150,
                    padding: '4px 10px',
                    fontSize: 12,
                    background: 'rgba(8,10,20,0.95)',
                    border: `1.5px solid ${color}`,
                    color: '#f1f5f9',
                    fontFamily: "'DM Mono', monospace",
                    boxShadow: `0 0 0 3px ${color}33`,
                    zIndex: 20,
                    transform: 'translateX(-50%)',
                    pointerEvents: 'auto',
                  }}
                  value={textInput.value}
                  onChange={e => setTextInput(t => ({ ...t, value: e.target.value }))}
                  onKeyDown={e => {
                    e.stopPropagation()
                    if (e.key === 'Enter') confirmText()
                    if (e.key === 'Escape') setTextInput(t => ({ ...t, visible: false }))
                  }}
                  onBlur={confirmText}
                  placeholder="テキスト入力 → Enter"
                />
              )}
            </div>
          </div>

          {/* ── TOOLBAR ── */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-t flex-shrink-0"
            style={{ background: '#0e1118', borderColor: '#1e2436' }}
          >
            {/* Tools */}
            <ToolBtn icon={Pencil} label="ペン"    active={tool === 'pen'}    onClick={() => setTool('pen')} />
            <ToolBtn icon={Eraser} label="消しゴム" active={tool === 'eraser'} onClick={() => setTool('eraser')} />
            <ToolBtn icon={Type}   label="テキスト" active={tool === 'text'}   onClick={() => setTool('text')} />

            <div className="w-px h-8 mx-1" style={{ background: '#1e2436' }} />

            {/* Color */}
            <div className="flex flex-col items-center gap-1">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border cursor-pointer"
                style={{ borderColor: '#2d3358', background: 'none', padding: 2 }}
                title="色"
              />
              <span className="text-xs" style={{ color: '#4b5675', fontFamily: "'DM Mono', monospace", fontSize: 9 }}>色</span>
            </div>

            {/* Size */}
            <div className="flex flex-col gap-1">
              <input
                type="range"
                min={1} max={20} step={1}
                value={size}
                onChange={e => setSize(Number(e.target.value))}
                className="w-20"
                style={{ accentColor: color }}
                title={`太さ: ${size}px`}
              />
              <span className="text-xs text-center" style={{ color: '#4b5675', fontFamily: "'DM Mono', monospace", fontSize: 9 }}>
                太さ {size}px
              </span>
            </div>

            <div className="w-px h-8 mx-1" style={{ background: '#1e2436' }} />

            <ToolBtn icon={Trash2} label="全消去" danger onClick={handleClear} />

            <div className="ml-auto flex items-center gap-2">
              {/* hidden file input for import */}
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              <button
                onClick={handleImportClick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: '#1a1d2e',
                  border: '1px solid #2d3358',
                  color: '#94a3b8',
                }}
                title="JSONファイルからインポート"
              >
                <Upload size={13} />
                import
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: '#1a1d2e',
                  border: '1px solid #2d3358',
                  color: '#94a3b8',
                }}
                title="JSONファイルにエクスポート"
              >
                <Download size={13} />
                export
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: saved ? '#1a2e1a' : '#1e2d4a',
                  border: `1px solid ${saved ? '#2d5a2d' : '#2d4a7a'}`,
                  color: saved ? '#4ade80' : '#60a5fa',
                }}
                title="LocalStorageに保存"
              >
                <Save size={13} />
                保存
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
