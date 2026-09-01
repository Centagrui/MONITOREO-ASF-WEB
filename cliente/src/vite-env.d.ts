/// <reference types="vite/client" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'bootstrap/dist/css/bootstrap.min.css';
declare module 'bootstrap-icons/font/bootstrap-icons.css';