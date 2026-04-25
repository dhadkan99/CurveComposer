from __future__ import annotations

import random
import shutil
from pathlib import Path

import numpy as np
from scipy.io import wavfile

GTZAN_PATH = r"C:\Users\dhadk\Downloads\archive(1)\Data\genres_original"
FRONTEND_PUBLIC_SONGS = r"../public/songs"
FRONTEND_DATA_FILE = r"../src/data/songGraphs.ts"
LIMIT = 100

TARGET_POINTS = 100
DURATION_SECONDS = 20

AUDIO_EXTS = {".wav"}


def list_audio_files(genres_root: Path) -> list[Path]:
    files: list[Path] = []
    for genre_dir in sorted([p for p in genres_root.iterdir() if p.is_dir()]):
        for p in genre_dir.rglob("*"):
            if p.is_file() and p.suffix.lower() in AUDIO_EXTS:
                files.append(p)
    return files


def normalize_01(arr: np.ndarray) -> np.ndarray:
    if arr.size == 0:
        return arr
    a_min = float(np.min(arr))
    a_max = float(np.max(arr))
    if not np.isfinite(a_min) or not np.isfinite(a_max) or a_min == a_max:
        return np.full_like(arr, 0.5, dtype=np.float32)
    out = (arr - a_min) / (a_max - a_min)
    return np.clip(out, 0.0, 1.0).astype(np.float32)


def resize_linear(arr: np.ndarray, target_len: int) -> np.ndarray:
    target_len = int(target_len)
    if target_len < 2:
        raise ValueError("target_len must be >= 2")
    if arr.size == 0:
        return np.zeros((target_len,), dtype=np.float32)
    if arr.size == 1:
        return np.full((target_len,), float(arr[0]), dtype=np.float32)
    if arr.size == target_len:
        return arr.astype(np.float32)
    old_x = np.linspace(0.0, 1.0, num=arr.size, dtype=np.float32)
    new_x = np.linspace(0.0, 1.0, num=target_len, dtype=np.float32)
    out = np.interp(new_x, old_x, arr.astype(np.float32)).astype(np.float32)
    return out


def to_float32_mono(audio: np.ndarray) -> np.ndarray:
    audio = np.asarray(audio)

    if audio.ndim == 2:
        audio = audio.astype(np.float32).mean(axis=1)
    else:
        audio = audio.astype(np.float32)

    if np.issubdtype(audio.dtype, np.integer):
        info = np.iinfo(audio.dtype)
        denom = float(max(abs(info.min), info.max))
        if denom > 0:
            audio = audio.astype(np.float32) / denom
    else:
        audio = audio.astype(np.float32)

    return np.nan_to_num(audio, nan=0.0, posinf=0.0, neginf=0.0).astype(np.float32)


def song_to_energy_graph(audio_path: Path) -> np.ndarray:
    sr, audio = wavfile.read(str(audio_path))
    if audio is None:
        raise ValueError("empty audio")

    y = to_float32_mono(audio)
    if y.size == 0:
        raise ValueError("empty audio")

    max_samples = int(sr * DURATION_SECONDS)
    y = y[:max_samples]

    chunks = np.array_split(y, TARGET_POINTS)
    rms = np.zeros((TARGET_POINTS,), dtype=np.float32)
    for i, c in enumerate(chunks):
        if c.size == 0:
            rms[i] = 0.0
        else:
            rms[i] = float(np.sqrt(np.mean(c * c, dtype=np.float64)))

    return normalize_01(rms)


def ts_string(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def write_song_graphs_ts(out_path: Path, rows: list[dict]) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    lines: list[str] = []
    lines.append("export type SongGraph = {")
    lines.append("  id: string")
    lines.append("  title: string")
    lines.append("  artist: string")
    lines.append("  genre: string")
    lines.append("  file: string")
    lines.append("  graph: number[]")
    lines.append("}")
    lines.append("")
    lines.append("export const songGraphs: SongGraph[] = [")

    for row in rows:
        graph = row["graph"]
        graph_str = ", ".join(f"{float(v):.6f}".rstrip("0").rstrip(".") for v in graph)
        lines.append("  {")
        lines.append(f"    id: {ts_string(row['id'])},")
        lines.append(f"    title: {ts_string(row['title'])},")
        lines.append(f"    artist: {ts_string(row['artist'])},")
        lines.append(f"    genre: {ts_string(row['genre'])},")
        lines.append(f"    file: {ts_string(row['file'])},")
        lines.append(f"    graph: [{graph_str}],")
        lines.append("  },")

    lines.append("]")
    lines.append("")

    out_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    genres_root = Path(GTZAN_PATH).expanduser().resolve()
    frontend_public_songs = (Path(__file__).parent / FRONTEND_PUBLIC_SONGS).resolve()
    frontend_data_file = (Path(__file__).parent / FRONTEND_DATA_FILE).resolve()
    limit = int(LIMIT)

    if not genres_root.exists():
        raise FileNotFoundError(f"GTZAN_PATH not found: {genres_root}")

    all_files = list_audio_files(genres_root)
    if not all_files:
        raise FileNotFoundError(f"No audio files found under: {genres_root}")

    random.shuffle(all_files)

    processed = 0
    skipped = 0
    out_rows: list[dict] = []

    for audio_path in all_files:
        if processed >= limit:
            break

        genre = audio_path.parent.name
        filename = audio_path.name

        try:
            graph = song_to_energy_graph(audio_path).tolist()

            rel_dst = Path(genre) / filename
            dst_path = frontend_public_songs / rel_dst
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(audio_path, dst_path)

            song_id = f"song_{processed + 1:03d}"
            out_rows.append(
                {
                    "id": song_id,
                    "title": filename,
                    "artist": "GTZAN Dataset",
                    "genre": genre,
                    "file": f"/songs/{genre}/{filename}",
                    "graph": graph,
                }
            )

            processed += 1
            print(f"Processed {processed}/{limit}: {genre}/{filename}")
        except Exception as e:
            skipped += 1
            print(f"Skipped: {genre}/{filename} ({e})")

    write_song_graphs_ts(frontend_data_file, out_rows)

    print("")
    print(f"Total processed: {processed}")
    print(f"Total skipped: {skipped}")
    print(f"Output data file: {frontend_data_file}")
    print(f"Songs copied to: {frontend_public_songs}")


if __name__ == "__main__":
    main()

