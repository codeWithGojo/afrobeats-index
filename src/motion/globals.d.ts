export {};
declare global {
  interface Window {
    AFRI_CURRENT_ARTISTS?: any[];
    AFRI_EMBEDDED_STATE?: any;
    AfriCurrentView?: any;
    AfriMotion?: {
      swap: (el: HTMLElement, html: string, id: string) => void;
      list: (el: HTMLElement, html: string) => void;
      compare: (el: HTMLElement, artists: any[]) => void;
      graph: (el: HTMLElement, artist: any, nodes: any[]) => void;
      notify: (message: string, kind?: "success" | "error" | "info") => void;
      vote: (winner: HTMLElement) => void;
    };
  }
}
