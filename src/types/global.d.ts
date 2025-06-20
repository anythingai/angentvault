// Global type definitions for AgentVault

// Handle missing type definitions for development dependencies
declare module 'babel__generator' {
  const content: any;
  export default content;
}

declare module 'babel__traverse' {
  const content: any;
  export default content;
}

declare module 'sinonjs__fake-timers' {
  const content: any;
  export default content;
}

declare module 'sizzle' {
  const content: any;
  export default content;
}

declare module 'stack-utils' {
  const content: any;
  export default content;
}

declare module 'yauzl' {
  const content: any;
  export default content;
}

// Extend global Window interface if needed
declare global {
  interface Window {
    // Add any global window properties here
  }
}

export {}; 