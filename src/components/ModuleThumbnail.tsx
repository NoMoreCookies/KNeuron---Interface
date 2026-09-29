import { useState } from "react";

interface ModuleThumbnailProps {
  src?: string;
  name: string;
}

/**
 * Displays a module thumbnail with a deterministic fallback.
 *
 * A broken or missing thumbnail must never break the launcher layout.
 */
export function ModuleThumbnail({ src, name }: ModuleThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const showFallback = !src || imageFailed;

  if (showFallback) {
    return (
      <div
        className="module-thumbnail module-thumbnail--fallback"
        aria-label={`${name} thumbnail unavailable`}
      >
        <span>{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      className="module-thumbnail"
      src={src}
      alt={`${name} thumbnail`}
      draggable={false}
      onError={() => setImageFailed(true)}
    />
  );
}
