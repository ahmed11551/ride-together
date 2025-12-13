/**
 * Type definitions for Yandex Maps JavaScript API 2.1
 * Partial types for what we use in the application
 */

export interface YandexMapsCoordinates {
  lat: number;
  lng: number;
}

export interface YandexMapsPlacemark {
  getPosition(): number[];
  setPosition(coords: number[]): void;
  properties: {
    set(key: string, value: unknown): void;
    get(key: string): unknown;
  };
  balloon: {
    open(): void;
    close(): void;
  };
  events: {
    add(type: string, handler: () => void): void;
    remove(type: string, handler: () => void): void;
  };
}

export interface YandexMapsPolyline {
  getLength(): number;
  getBounds(): number[][] | null;
}

export interface YandexMapsMap {
  setCenter(coords: number[]): void;
  setZoom(zoom: number): void;
  getCenter(): number[];
  getZoom(): number;
  setBounds(bounds: number[][], options?: Record<string, unknown>): void;
  geoObjects: {
    add(object: YandexMapsPlacemark | YandexMapsPolyline): void;
    remove(object: YandexMapsPlacemark | YandexMapsPolyline): void;
    getBounds(): number[][] | null;
  };
  controls: {
    add(control: string): void;
    remove(control: string): void;
  };
  destroy(): void;
}

export interface YandexMapsConstructor {
  new (element: HTMLElement | string, state: {
    center: number[];
    zoom: number;
    controls?: string[];
  }): YandexMapsMap;
}

export interface YandexMapsPlacemarkConstructor {
  new (
    coords: number[],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>
  ): YandexMapsPlacemark;
}

export interface YandexMapsPolylineConstructor {
  new (
    coords: number[][],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>
  ): YandexMapsPolyline;
}

export interface YandexMapsRouting {
  multiRouter: {
    new (options: {
      referencePoints: number[][];
      params?: Record<string, unknown>;
    }): {
      model: {
        events: {
          add(type: string, handler: () => void): void;
        };
        getRoutes(): Array<{
          properties: {
            get(key: string): unknown;
          };
        }>;
      };
      getActiveRoute(): {
        properties: {
          get(key: string): unknown;
        };
      } | null;
    };
  };
}

export interface YandexMapsAPI {
  ready(callback: () => void): void;
  Map: YandexMapsConstructor;
  Placemark: YandexMapsPlacemarkConstructor;
  Polyline: YandexMapsPolylineConstructor;
  multiRouter?: YandexMapsRouting['multiRouter'];
}

declare global {
  interface Window {
    ymaps: YandexMapsAPI;
  }
}

