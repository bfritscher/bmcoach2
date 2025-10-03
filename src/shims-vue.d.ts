// Type declarations for Vue SFCs
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Allow @ alias imports in TS (tsconfig already maps @ to ./src)
declare module '@/*'
