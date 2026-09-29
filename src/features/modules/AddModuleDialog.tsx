import { useRef, useState, type FormEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import type { KNeuronModuleManifest } from '../../types/module';

interface Props { open: boolean; onClose: () => void; onAdd: (module: KNeuronModuleManifest) => void; }

export function AddModuleDialog({ open, onClose, onAdd }: Props) {
  const [thumbnail, setThumbnail] = useState<string>();
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  const selectThumbnail = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Thumbnail must be an image.'); return; }
    if (file.size > 2_000_000) { setError('Thumbnail must be smaller than 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { setThumbnail(reader.result); setError(''); } };
    reader.readAsDataURL(file);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const id = String(data.get('id') ?? '').trim().toLowerCase();
    if (!name || !/^[a-z0-9-]+$/.test(id)) { setError('Enter a name and an id using lowercase letters, numbers and hyphens.'); return; }
    try {
      onAdd({ id, name, version: '0.1.0', description: String(data.get('description') ?? '').trim() || 'KNeuron module', category: String(data.get('category') ?? 'Module'), thumbnail, entryPoint: `/modules/${id}`, requiresEEG: data.get('requiresEEG') === 'on' });
      setThumbnail(undefined); setError(''); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not add module.'); }
  };

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="add-module-title">
      <div className="dialog-title"><div><span>MODULE REGISTRY</span><h2 id="add-module-title">Add module metadata</h2></div><button aria-label="Close" onClick={onClose}><X size={20}/></button></div>
      <form onSubmit={submit}>
        <label>Module name<input name="name" placeholder="e.g. Cortex 3D" required/></label>
        <label>Module id<input name="id" placeholder="e.g. cortex-3d" required/></label>
        <label>Description<textarea name="description" rows={3} placeholder="Short description shown on the application card."/></label>
        <label>Category<input name="category" placeholder="e.g. Visualization"/></label>
        <label className="thumbnail-picker">Thumbnail
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => selectThumbnail(e.target.files?.[0])}/>
          <button type="button" className="thumbnail-button" onClick={() => fileRef.current?.click()}>{thumbnail ? <img src={thumbnail} alt="Selected module thumbnail"/> : <><ImagePlus size={28}/><span>Choose PNG, JPG or WebP</span><small>Recommended 16:9 · max 2 MB</small></>}</button>
        </label>
        <label className="check-row"><input type="checkbox" name="requiresEEG"/><span>Requires an EEG device</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button">Add to registry</button></div>
      </form>
    </section>
  </div>;
}
