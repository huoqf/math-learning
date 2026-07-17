import { useCallback, type RefObject } from 'react'

export function clientToSvgPoint(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement | null
): { x: number; y: number } | null {
  if (!svg) return null
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  return pt.matrixTransform(ctm.inverse())
}

export function useViewportPointer(svgRef: RefObject<SVGSVGElement | null>) {
  return useCallback(
    (clientX: number, clientY: number) => {
      return clientToSvgPoint(clientX, clientY, svgRef.current)
    },
    [svgRef]
  )
}
