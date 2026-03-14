import { useRef, useEffect, useCallback } from 'react'

export const CANVAS_W = 680
export const CANVAS_H = 460

export function drawGrid(ctx, w = CANVAS_W, h = CANVAS_H) {
  ctx.fillStyle = '#111827'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = '#1e2a3a'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y <= h; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  // Accent lines every 4 cells
  ctx.strokeStyle = '#2d3f54'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= w; x += 128) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let y = 0; y <= h; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, w, h)
}

export function useDrawCanvas(mapRef) {
  const bgCanvasRef  = useRef(null)
  const drawCanvasRef = useRef(null)
  const isDrawing    = useRef(false)
  const lastPos      = useRef({ x: 0, y: 0 })

  // Render background
  const renderBg = useCallback(() => {
    const map = mapRef.current
    const canvas = bgCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (map?.image_data) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H)
      img.src = map.image_data
    } else {
      drawGrid(ctx, CANVAS_W, CANVAS_H)
    }
  }, [mapRef])

  // Render draw layer
  const renderDraw = useCallback(() => {
    const map = mapRef.current
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    if (map?.canvas_data) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = map.canvas_data
    }
  }, [mapRef])

  // Get canvas data URL
  const getDrawData = useCallback(() => {
    return drawCanvasRef.current?.toDataURL('image/png') ?? null
  }, [])

  const clearDraw = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, CANVAS_W, CANVAS_H)
  }, [])

  return { bgCanvasRef, drawCanvasRef, isDrawing, lastPos, renderBg, renderDraw, getDrawData, clearDraw }
}
