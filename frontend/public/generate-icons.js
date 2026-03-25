// Run this once: node generate-icons.js
// Requires: npm install canvas
const { createCanvas } = require('canvas')
const fs = require('fs')

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#030712'
  const r = size * 0.16
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fill()

  // Gradient stroke for border
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, 'rgba(0,255,231,0.3)')
  grad.addColorStop(1, 'rgba(56,189,248,0.1)')
  ctx.strokeStyle = grad
  ctx.lineWidth = size * 0.02
  ctx.stroke()

  // Heart rate line
  const lineGrad = ctx.createLinearGradient(0, 0, size, 0)
  lineGrad.addColorStop(0, '#00ffe7')
  lineGrad.addColorStop(1, '#38bdf8')
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = size * 0.055
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const p = (v) => v / 512 * size
  ctx.beginPath()
  ctx.moveTo(p(60), p(256))
  ctx.lineTo(p(140), p(256))
  ctx.lineTo(p(170), p(160))
  ctx.lineTo(p(210), p(340))
  ctx.lineTo(p(250), p(200))
  ctx.lineTo(p(290), p(300))
  ctx.lineTo(p(320), p(256))
  ctx.lineTo(p(460), p(256))
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

fs.writeFileSync('icon-192.png', drawIcon(192))
fs.writeFileSync('icon-512.png', drawIcon(512))
console.log('Icons generated!')
