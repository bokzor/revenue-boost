'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Prize {
  text: string
  color: string
}

const prizes: Prize[] = [
  { text: '10% OFF', color: '#6366F1' },
  { text: 'NO LUCK', color: '#6B7280' },
  { text: '20% OFF', color: '#EC4899' },
  { text: 'FREE SHIP', color: '#10B981' },
  { text: 'NO LUCK', color: '#6B7280' },
  { text: 'MYSTERY', color: '#F59E0B' },
  { text: '5% OFF', color: '#8B5CF6' },
  { text: 'TRY AGAIN', color: '#6B7280' },
]

export default function SpinToWinPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState(false)
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [resultText, setResultText] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isWinner, setIsWinner] = useState(false)

  const wheelStateRef = useRef({
    currentRotation: 0,
    spinVelocity: 0,
    canvasSize: 0,
    radius: 0,
    centerX: 0,
    centerY: 0,
  })

  const numSegments = prizes.length
  const segmentAngle = (2 * Math.PI) / numSegments
  const friction = 0.995
  const minSpinVelocity = 0.002

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { currentRotation, canvasSize, radius, centerX, centerY } = wheelStateRef.current

    ctx.clearRect(0, 0, canvasSize, canvasSize)

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(currentRotation)

    for (let i = 0; i < numSegments; i++) {
      const angle = i * segmentAngle
      const { text, color } = prizes[i]

      ctx.beginPath()
      ctx.fillStyle = color
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, radius, angle, angle + segmentAngle)
      ctx.closePath()
      ctx.fill()

      ctx.save()
      ctx.fillStyle = 'white'
      const fontSize = Math.max(16, canvasSize / 40)
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const textAngle = angle + segmentAngle / 2
      ctx.rotate(textAngle)
      ctx.fillText(text, radius * 0.65, 0)
      ctx.restore()
    }
    ctx.restore()

    function drawPointer() {
      ctx.save()
      ctx.fillStyle = 'white'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetY = 3

      ctx.beginPath()

      const pointerTipX = centerX + radius - 8
      const pointerTipY = centerY
      const pointerBaseX = centerX + radius + 22
      const pointerBaseYOffset = 18

      ctx.moveTo(pointerTipX, pointerTipY)
      ctx.lineTo(pointerBaseX, pointerTipY - pointerBaseYOffset)
      ctx.lineTo(pointerBaseX, pointerTipY + pointerBaseYOffset)
      ctx.closePath()
      ctx.fill()

      ctx.restore()
    }

    drawPointer()
  }, [numSegments, segmentAngle])

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    let canvasSize: number
    if (window.innerWidth < 640) {
      const heightBasedSize = containerHeight * 1.1
      const widthBasedMaxSize = containerWidth * (4 / 3)
      canvasSize = Math.min(heightBasedSize, widthBasedMaxSize)
    } else if (window.innerWidth < 1024) {
      const heightBasedSize = containerHeight * 0.75
      const widthBasedMaxSize = containerWidth * 1.6
      canvasSize = Math.min(heightBasedSize, widthBasedMaxSize, 450)
    } else {
      const heightBasedSize = containerHeight * 0.9
      const widthBasedMaxSize = containerWidth * 1.8
      canvasSize = Math.min(heightBasedSize, widthBasedMaxSize)
    }

    canvas.width = canvasSize
    canvas.height = canvasSize

    wheelStateRef.current.canvasSize = canvasSize
    wheelStateRef.current.centerX = canvasSize / 2
    wheelStateRef.current.centerY = canvasSize / 2
    wheelStateRef.current.radius = Math.max(0, canvasSize / 2 - 5)

    drawWheel()
  }, [drawWheel])

  const determineWinner = useCallback(() => {
    const { currentRotation } = wheelStateRef.current
    const isMobile = window.innerWidth < 640
    const pointerAngle = isMobile ? -Math.PI / 2 : 0

    let finalAngle = currentRotation % (2 * Math.PI)
    if (finalAngle < 0) finalAngle += 2 * Math.PI

    let relativeAngle = (2 * Math.PI) - finalAngle + pointerAngle
    let winningIndex = Math.floor(relativeAngle / segmentAngle) % numSegments

    const winner = prizes[winningIndex]

    if (winner.text.includes('NO LUCK') || winner.text.includes('TRY AGAIN')) {
      setResultText(`Oh no! ${winner.text}. Better luck next time.`)
      setIsWinner(false)
    } else {
      setResultText(`Congratulations! You won: ${winner.text}`)
      setIsWinner(true)
    }

    setShowResult(true)
    setIsSpinning(false)
  }, [numSegments, segmentAngle])

  const animate = useCallback(() => {
    const state = wheelStateRef.current

    state.currentRotation += state.spinVelocity
    state.spinVelocity *= friction

    if (Math.abs(state.spinVelocity) < minSpinVelocity) {
      state.spinVelocity = 0
      determineWinner()
      return
    }

    drawWheel()
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [drawWheel, determineWinner, friction, minSpinVelocity])

  const startSpin = () => {
    if (isSpinning || !isEmailSubmitted) return

    setIsSpinning(true)
    setShowResult(false)

    wheelStateRef.current.spinVelocity = Math.random() * 0.3 + 0.4

    animate()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (email && emailRegex.test(email)) {
      setEmailError(false)
      setIsEmailSubmitted(true)
    } else {
      setEmailError(true)
    }
  }

  useEffect(() => {
    setupCanvas()
    window.addEventListener('resize', setupCanvas)
    return () => {
      window.removeEventListener('resize', setupCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [setupCanvas])

  return (
    <div className="container">
      <div ref={containerRef} className="wheel-container">
        {/* The Canvas for the Wheel */}
        <canvas ref={canvasRef} className="wheel-canvas" />
      </div>

      {/* Form Content */}
      <div className="form-pane">
        <div className="form-content">
          <h1 className="title">
            {isEmailSubmitted ? "You're all set!" : 'Spin to Win!'}
          </h1>
          <p className="subtitle">
            {isEmailSubmitted
              ? 'Click the button to spin the wheel and claim your prize. Good luck!'
              : 'Enter your email for a chance to win an exclusive prize. Good luck!'}
          </p>

          {!isEmailSubmitted && (
            <form onSubmit={handleSubmit} className="form">
              <div>
                <label htmlFor="emailInput" className="sr-only">
                  Email address
                </label>
                <input
                  type="email"
                  id="emailInput"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={emailError ? 'input input-error' : 'input'}
                  placeholder="your.email@example.com"
                />
                {emailError && (
                  <p className="error-text">
                    Please enter a valid email address.
                  </p>
                )}
              </div>
              <button type="submit" className="button button-primary">
                UNLOCK YOUR SPIN
              </button>
            </form>
          )}

          {isEmailSubmitted && (
            <button
              onClick={startSpin}
              disabled={isSpinning}
              className="button button-spin"
            >
              {isSpinning ? 'SPINNING...' : showResult ? 'SPIN AGAIN' : 'SPIN NOW!'}
            </button>
          )}

          {showResult && (
            <div className={`result-box ${isWinner ? 'winner' : 'loser'}`}>
              <p className="result-text">{resultText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
