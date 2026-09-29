import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../config/defaultSettings";

import { SettingsStore } from "./settingsStore";

const STORAGE_KEY = "kneuron.settings.v1";

describe("SettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("loads default settings when nothing is persisted", () => {
    const store = new SettingsStore();

    expect(store.get()).toEqual(DEFAULT_SETTINGS);
  });

  it("updates settings", () => {
    const store = new SettingsStore();

    store.update({
      confirmBeforeClosingModule: false,
    });

    expect(store.get()).toEqual({
      ...DEFAULT_SETTINGS,
      confirmBeforeClosingModule: false,
    });
  });

  it("persists updated settings in localStorage", () => {
    const store = new SettingsStore();

    store.update({
      showDebugInformation: true,
    });

    const raw = window.localStorage.getItem(STORAGE_KEY);

    expect(raw).not.toBeNull();

    expect(JSON.parse(raw!)).toEqual({
      ...DEFAULT_SETTINGS,
      showDebugInformation: true,
    });
  });

  it("loads valid persisted settings", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        confirmBeforeClosingModule: false,
        showDebugInformation: true,
      }),
    );

    const store = new SettingsStore();

    expect(store.get()).toEqual({
      confirmBeforeClosingModule: false,
      showDebugInformation: true,
    });
  });

  it("ignores obsolete properties from older settings versions", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        confirmBeforeClosingModule: true,
        showDebugInformation: false,

        animationsEnabled: false,
        uiScale: 110,
      }),
    );

    const store = new SettingsStore();

    expect(store.get()).toEqual({
      confirmBeforeClosingModule: true,
      showDebugInformation: false,
    });
  });

  it("falls back to defaults when persisted settings are invalid", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        confirmBeforeClosingModule: "invalid",

        showDebugInformation: false,
      }),
    );

    const store = new SettingsStore();

    expect(store.get()).toEqual(DEFAULT_SETTINGS);
  });

  it("resets settings to defaults", () => {
    const store = new SettingsStore();

    store.update({
      confirmBeforeClosingModule: false,
      showDebugInformation: true,
    });

    store.reset();

    expect(store.get()).toEqual(DEFAULT_SETTINGS);

    const persisted = window.localStorage.getItem(STORAGE_KEY);

    expect(JSON.parse(persisted!)).toEqual(DEFAULT_SETTINGS);
  });

  it("notifies subscribers after an update", () => {
    const store = new SettingsStore();

    let received = store.get();

    const unsubscribe = store.subscribe((settings) => {
      received = settings;
    });

    store.update({
      showDebugInformation: true,
    });

    expect(received.showDebugInformation).toBe(true);

    unsubscribe();
  });
});
