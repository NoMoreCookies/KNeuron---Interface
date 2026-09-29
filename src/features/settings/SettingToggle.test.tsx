import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { SettingToggle } from "./SettingToggle";

describe("SettingToggle", () => {
  it("renders the OFF state", () => {
    render(<SettingToggle checked={false} ariaLabel="Test setting" onChange={() => {}} />);

    const toggle = screen.getByRole("switch", {
      name: "Test setting",
    });

    expect(toggle).toHaveAttribute("aria-checked", "false");

    expect(screen.getByText("OFF")).toBeInTheDocument();
  });

  it("renders the ON state", () => {
    render(<SettingToggle checked ariaLabel="Test setting" onChange={() => {}} />);

    expect(
      screen.getByRole("switch", {
        name: "Test setting",
      }),
    ).toHaveAttribute("aria-checked", "true");

    expect(screen.getByText("ON")).toBeInTheDocument();
  });

  it("requests enabling when an OFF toggle is clicked", () => {
    const onChange = vi.fn();

    render(<SettingToggle checked={false} ariaLabel="Test setting" onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("switch", {
        name: "Test setting",
      }),
    );

    expect(onChange).toHaveBeenCalledTimes(1);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("requests disabling when an ON toggle is clicked", () => {
    const onChange = vi.fn();

    render(<SettingToggle checked ariaLabel="Test setting" onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("switch", {
        name: "Test setting",
      }),
    );

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
