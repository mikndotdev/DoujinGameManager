import { useState, useCallback, useRef, type ChangeEvent, type FormEvent } from "react";
import {
  CloudDownloadIcon,
  CloudUploadIcon,
  CopyIcon,
  DownloadIcon,
  PlusIcon,
  UploadIcon,
} from "lucide-react";
import useSWR from "swr";
import { z } from "zod";
import LocalStorageItem from "../components/localStorageItem.tsx";

type LocalStorageEntry = [string, string];

interface LocalStorageExportV1 {
  version: 1;
  exportedAt: string;
  entries: Array<{ key: string; value: string }>;
}

const importEntrySchema = z.union([
  z.tuple([z.string(), z.string()]).transform(([key, value]) => ({ key, value })),
  z.object({ key: z.string(), value: z.string() }),
]);

const importPayloadSchema = z.union([
  z.array(importEntrySchema),
  z.object({
    version: z.number().optional(),
    exportedAt: z.string().optional(),
    entries: z.array(importEntrySchema),
  }),
]);

function getAllLocalStorageEntries(): LocalStorageEntry[] {
  const entries: LocalStorageEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null) {
      entries.push([key, localStorage.getItem(key) ?? ""]);
    }
  }
  return entries.sort((a, b) => a[0].localeCompare(b[0]));
}

function parseImportedEntries(payload: unknown): LocalStorageEntry[] {
  const parsed = importPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      "JSON の形式が不正です。このページでエクスポートしたファイルを使用してください。",
    );
  }

  const sourceEntries = Array.isArray(parsed.data) ? parsed.data : parsed.data.entries;
  const deduplicated = new Map<string, string>();

  for (const item of sourceEntries) {
    const key = item.key.trim();
    if (key === "") {
      throw new Error("インポートデータに空のキーがあります。");
    }
    deduplicated.set(key, item.value);
  }

  return [...deduplicated.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

async function healthcheckFetcher(url: string): Promise<{ status: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("cloud unavailable");
  }
  return (await res.json()) as { status: string };
}

export default function ManageData() {
  const [entries, setEntries] = useState<LocalStorageEntry[]>(getAllLocalStorageEntries);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [replaceAllOnImport, setReplaceAllOnImport] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const codeModalRef = useRef<HTMLDialogElement>(null);
  const loadModalRef = useRef<HTMLDialogElement>(null);
  const [uploadedCode, setUploadedCode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadCode, setDownloadCode] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { data: health, error: healthError } = useSWR("/api/healthcheck", healthcheckFetcher, {
    shouldRetryOnError: false,
  });
  const cloudAvailable = !healthError && health?.status === "ok";

  const refresh = useCallback(() => {
    setEntries(getAllLocalStorageEntries());
  }, []);

  const applyEntries = useCallback(
    (importedEntries: LocalStorageEntry[]): number => {
      if (importedEntries.length === 0) {
        throw new Error("インポートデータがありません。");
      }
      if (replaceAllOnImport) {
        localStorage.clear();
      }
      for (const [key, value] of importedEntries) {
        localStorage.setItem(key, value);
      }
      refresh();
      return importedEntries.length;
    },
    [refresh, replaceAllOnImport],
  );

  const handleSave = useCallback(
    (oldKey: string, newKey: string, value: string) => {
      if (oldKey !== newKey) {
        localStorage.removeItem(oldKey);
      }
      localStorage.setItem(newKey, value);
      refresh();
    },
    [refresh],
  );

  const handleDelete = useCallback(
    (key: string) => {
      localStorage.removeItem(key);
      refresh();
    },
    [refresh],
  );

  const handleAdd = useCallback(() => {
    const base = "new-key";
    let candidate = base;
    let i = 1;
    while (localStorage.getItem(candidate) !== null) {
      candidate = `${base}-${i++}`;
    }
    localStorage.setItem(candidate, "");
    refresh();
    setStatus(null);
  }, [refresh]);

  const handleExport = useCallback(() => {
    const payload: LocalStorageExportV1 = {
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: getAllLocalStorageEntries().map(([key, value]) => ({ key, value })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `local-storage-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus({
      kind: "success",
      message: `${payload.entries.length} 件のデータをエクスポートしました。`,
    });
  }, []);

  const handleImportClick = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      try {
        const content = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(content) as unknown;
        } catch {
          throw new Error("JSON を読み込めませんでした。ファイル形式を確認してください。");
        }

        const importedEntries = parseImportedEntries(parsed);
        const count = applyEntries(importedEntries);
        setStatus({
          kind: "success",
          message: replaceAllOnImport
            ? `${count} 件のデータで全件置き換えました。`
            : `${count} 件のデータをインポートしました。`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "インポートに失敗しました。";
        setStatus({ kind: "error", message });
      } finally {
        event.target.value = "";
      }
    },
    [applyEntries, replaceAllOnImport],
  );

  const handleCloudSave = useCallback(async () => {
    setUploading(true);
    setStatus(null);
    try {
      const payload: LocalStorageExportV1 = {
        version: 1,
        exportedAt: new Date().toISOString(),
        entries: getAllLocalStorageEntries().map(([key, value]) => ({ key, value })),
      };
      if (payload.entries.length === 0) {
        throw new Error("アップロードするデータがありません。");
      }
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("クラウドへのアップロードに失敗しました。");
      }
      const { code } = (await res.json()) as { code: string };
      setUploadedCode(code);
      codeModalRef.current?.showModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "アップロードに失敗しました。";
      setStatus({ kind: "error", message });
    } finally {
      setUploading(false);
    }
  }, []);

  const handleCopyCode = useCallback(() => {
    void navigator.clipboard?.writeText(uploadedCode);
  }, [uploadedCode]);

  const openLoadModal = useCallback(() => {
    setDownloadCode("");
    setLoadError(null);
    loadModalRef.current?.showModal();
  }, []);

  const handleCloudLoad = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const code = downloadCode.trim().toUpperCase();
      if (code.length !== 6) {
        setLoadError("6文字のコードを入力してください。");
        return;
      }
      setDownloading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/pull/${code}`);
        if (res.status === 404) {
          throw new Error("コードが見つかりませんでした。");
        }
        if (!res.ok) {
          throw new Error("クラウドからの読み込みに失敗しました。");
        }
        const payload = (await res.json()) as unknown;
        const importedEntries = parseImportedEntries(payload);
        const count = applyEntries(importedEntries);
        loadModalRef.current?.close();
        setStatus({
          kind: "success",
          message: replaceAllOnImport
            ? `${count} 件のデータで全件置き換えました。`
            : `${count} 件のデータを読み込みました。`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "読み込みに失敗しました。";
        setLoadError(message);
      } finally {
        setDownloading(false);
      }
    },
    [applyEntries, downloadCode, replaceAllOnImport],
  );

  return (
    <div className="container mx-auto p-4 pb-24">
      <div className="flex flex-row justify-between items-start mb-4 gap-3">
        <h1 className="text-2xl font-bold">データ管理</h1>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-row flex-wrap justify-end gap-2">
            <button className="btn btn-outline btn-sm sm:btn-md" onClick={handleExport}>
              <DownloadIcon className="size-4" />
              エクスポート
            </button>
            <button className="btn btn-secondary btn-sm sm:btn-md" onClick={handleImportClick}>
              <UploadIcon className="size-4" />
              インポート
            </button>
            {cloudAvailable && (
              <>
                <button
                  className="btn btn-accent btn-sm sm:btn-md"
                  onClick={handleCloudSave}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <CloudUploadIcon className="size-4" />
                  )}
                  クラウド保存
                </button>
                <button className="btn btn-info btn-sm sm:btn-md" onClick={openLoadModal}>
                  <CloudDownloadIcon className="size-4" />
                  クラウド読込
                </button>
              </>
            )}
            <button className="btn btn-primary btn-sm sm:btn-md" onClick={handleAdd}>
              <PlusIcon className="size-4" />
              追加
            </button>
          </div>
          <label className="label cursor-pointer gap-2 p-0">
            <span className="label-text text-sm">インポート時に既存データを全て置き換える</span>
            <input
              type="checkbox"
              className="toggle toggle-warning toggle-sm"
              checked={replaceAllOnImport}
              onChange={(e) => setReplaceAllOnImport(e.target.checked)}
            />
          </label>
          <input
            ref={importInputRef}
            type="file"
            className="hidden"
            accept="application/json"
            onChange={handleImportFile}
          />
        </div>
      </div>
      {status && (
        <div
          className={`alert mb-4 ${status.kind === "success" ? "alert-success" : "alert-error"}`}
        >
          <span>{status.message}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {entries.map(([key, value]) => (
          <LocalStorageItem
            key={key}
            storageKey={key}
            storageValue={value}
            onDelete={handleDelete}
            onSave={handleSave}
          />
        ))}
        {entries.length === 0 && (
          <p className="text-center text-base-content/50 py-8">
            ローカルストレージにデータがありません。
          </p>
        )}
      </div>

      <dialog ref={codeModalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">クラウド保存コード</h3>
          <p className="py-2 text-sm text-base-content/70">
            別の端末でこのコードを入力すると、データを読み込めます。コードは7日間有効です。
          </p>
          <div className="flex flex-row items-center justify-center gap-2 py-2">
            <span className="font-mono text-3xl tracking-[0.3em] font-bold">{uploadedCode}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleCopyCode} title="コピー">
              <CopyIcon className="size-4" />
            </button>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">閉じる</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog ref={loadModalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">クラウドから読み込み</h3>
          <p className="py-2 text-sm text-base-content/70">
            別の端末で発行された6文字のコードを入力してください。
          </p>
          <form onSubmit={handleCloudLoad} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="ABC123"
              className="input input-bordered w-full text-center font-mono text-2xl tracking-[0.3em] uppercase"
              maxLength={6}
              value={downloadCode}
              autoFocus
              onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
            />
            {loadError && <span className="text-error text-sm">{loadError}</span>}
            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => loadModalRef.current?.close()}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={downloading || downloadCode.trim().length !== 6}
              >
                {downloading && <span className="loading loading-spinner loading-sm" />}
                読み込む
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
