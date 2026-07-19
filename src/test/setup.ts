import "@testing-library/jest-dom";

// ResizeObserver polyfill for jsdom
class ResizeObserverMock {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_cb: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});
