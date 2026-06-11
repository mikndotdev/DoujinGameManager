import { useState } from "react";
import { SaveIcon, Trash2Icon } from "lucide-react";

interface LocalStorageItemProps {
  storageKey: string;
  storageValue: string;
  onDelete: (key: string) => void;
  onSave: (key: string, newKey: string, value: string) => void;
}

export default function LocalStorageItem({
  storageKey,
  storageValue,
  onDelete,
  onSave,
}: LocalStorageItemProps) {
  const [key, setKey] = useState(storageKey);
  const [value, setValue] = useState(storageValue);

  const keyDirty = key !== storageKey;
  const valueDirty = value !== storageValue;
  const dirty = keyDirty || valueDirty;

  return (
    <div className="card bg-base-200 shadow-md w-full">
      <div className="card-body flex flex-col gap-3 p-4 sm:p-6">
        <input
          type="text"
          placeholder="Key"
          className={`input input-bordered w-full ${keyDirty ? "input-warning" : ""}`}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <textarea
          placeholder="Value"
          className={`textarea textarea-bordered w-full min-h-24 ${valueDirty ? "textarea-warning" : ""}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex flex-row gap-2 justify-end">
          <button
            className="btn btn-success btn-sm sm:btn-md"
            disabled={!dirty || key.trim() === ""}
            onClick={() => onSave(storageKey, key.trim(), value)}
          >
            <SaveIcon className="size-4" />
            保存
          </button>
          <button className="btn btn-error btn-sm sm:btn-md" onClick={() => onDelete(storageKey)}>
            <Trash2Icon className="size-4" />
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
