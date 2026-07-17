import React, { type RefObject } from 'react'

interface AnimationSvgCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>
  transform: string
  children: React.ReactNode
  svgRef?: RefObject<SVGSVGElement | null>
  canvasRef?: RefObject<HTMLCanvasElement | null>
  className?: string
  onMouseMove?: React.MouseEventHandler<SVGSVGElement>
  onMouseUp?: React.MouseEventHandler<SVGSVGElement>
  onMouseLeave?: React.MouseEventHandler<SVGSVGElement>
  onMouseDown?: React.MouseEventHandler<SVGSVGElement>
  onClick?: React.MouseEventHandler<SVGSVGElement>
  onTouchStart?: React.TouchEventHandler<SVGSVGElement>
  onTouchMove?: React.TouchEventHandler<SVGSVGElement>
  onTouchEnd?: React.TouchEventHandler<SVGSVGElement>
  onPointerMove?: React.PointerEventHandler<SVGSVGElement>
  onPointerUp?: React.PointerEventHandler<SVGSVGElement>
}

export const AnimationSvgCanvas = React.memo<AnimationSvgCanvasProps>(
  function AnimationSvgCanvas({
    containerRef,
    transform,
    children,
    svgRef,
    canvasRef,
    className = '',
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onMouseDown,
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onPointerMove,
    onPointerUp,
  }) {
    const hasCanvas = !!canvasRef
    return (
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden${hasCanvas ? ' relative' : ''}${className ? ` ${className}` : ''}`}
      >
        {hasCanvas && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden
          />
        )}
        <svg
          ref={svgRef}
          className={`block select-none w-full h-full${hasCanvas ? ' absolute inset-0 pointer-events-none' : ''}`}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onClick={onClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <g transform={transform}>
            {children}
          </g>
        </svg>
      </div>
    )
  }
)
