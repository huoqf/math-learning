import { Component, type ReactNode } from "react";

interface State {
  crashed: boolean;
  key: number;
}

interface Props {
  children: ReactNode;
}

/**
 * 3D 画布 ErrorBoundary：捕获 R3F / OrbitControls 卸载竞态导致的偶发崩溃
 * （`Cannot read properties of null (reading 'addEventListener')`）。
 *
 * 策略：首次捕获后自动 reset（递增 key 强制重建子树），避免白屏。
 * 第二次崩溃才展示用户可见的降级 UI，防止无限重建循环。
 */
export class Canvas3DErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, key: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { crashed: true };
  }

  componentDidCatch(error: Error) {
    // 首次竞态崩溃：自动重建（key 递增触发子树销毁重挂载）
    if (this.state.key === 0) {
      console.error(
        "[Canvas3DErrorBoundary] 检测到 3D 画布竞态崩溃，自动重建：",
        error,
      );
      this.setState((s) => ({ crashed: false, key: s.key + 1 }));
    }
    // 若重建后仍崩溃（key > 0），保留 crashed = true 展示降级 UI
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="flex items-center justify-center h-full text-neutral-400 text-sm">
          3D 渲染出现异常，请刷新页面重试。
        </div>
      );
    }
    // key 变化时 React 会销毁并重新挂载整个子树（包含 R3F Canvas），
    // 确保 WebGL 上下文、OrbitControls 与所有订阅者完全从零初始化。
    // 使用 display: contents 消除对父级显式确定高度的依赖，防止在不同容器中意外塌陷。
    return (
      <div key={this.state.key} style={{ display: "contents" }}>
        {this.props.children}
      </div>
    );
  }
}
