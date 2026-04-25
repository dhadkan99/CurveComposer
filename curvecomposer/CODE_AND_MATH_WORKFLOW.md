# CurveComposer Code and Math Workflow

## Overview
CurveComposer is a React + TypeScript web app that lets users write a mathematical function and then finds songs whose precomputed audio energy graphs resemble the function's curve. The app bridges math, curve analysis, and audio fingerprint matching.

The core workflow is:
1. User enters a function expression like `sin(x)`.
2. The app samples that expression across a fixed `x` domain to create a curve.
3. The sampled curve is normalized and analyzed.
4. Preprocessed song energy graphs are compared to the function curve.
5. The best matches are ranked and displayed.

## Important files
- `src/App.tsx` - app entry and view selection.
- `src/components/CurveComposerPage.tsx` - main interactive page.
- `src/utils/mathEngine.ts` - generates curves from math expressions.
- `src/utils/similarityEngine.ts` - computes similarity between curves.
- `src/data/songGraphs.ts` - precomputed song energy graphs.
- `backend/preprocess_songs.py` - Python script that converts WAV files into normalized energy graphs.
- `src/components/CurveInsights.tsx` - displays numeric curve statistics.
- `src/components/SimilarSongsPanel.tsx` - lists matched songs and previews their graphs.
- `src/components/FunctionInput.tsx` - user input / preset control.

## App structure

### `src/App.tsx`
- Maintains the top-level view state: `landing` or `app`.
- Renders `LandingPage` initially.
- When the user starts, it renders `CurveComposerPage`.

### `src/components/CurveComposerPage.tsx`
- Holds the current function expression in React state.
- Uses `generateCurveFromExpression()` from `mathEngine.ts` to convert the expression into curve data.
- Builds a `ySeries` array from the curve points.
- Uses `findTopSongMatches()` from `similarityEngine.ts` to score songs.
- Displays:
  - `FunctionInput` for entering or selecting equations.
  - `GraphCanvas` for curve visualization.
  - `CurveInsights` for numeric insights.
  - `SimilarSongsPanel` for ranked song matches.
  - `MatchExplanationPanel` for the algorithm explanation.

## Math workflow: function -> curve

### `src/utils/mathEngine.ts`
This module converts a user-entered math expression into a sampled curve and derives features from it.

#### `generateCurveFromExpression(expression, opts)`
- `expression`: string, e.g. `sin(x)`, `x^2`, `sin(x)+cos(2*x)`.
- `opts.xMin`, `opts.xMax`: domain boundaries, default `[-Math.PI, Math.PI]`.
- `opts.samples`: number of samples, default `256` but clamped to at least `16`.

#### Sampling process
- Compiles the expression using `mathjs`.
- Evaluates the expression at `samples` evenly spaced `x` values.
  - `x = xMin + (xMax - xMin) * (i / (samples - 1))`.
- If `y` is not finite, uses the previous finite value or `0`.
- Collects points as `{ x, y }`.

#### Robust clipping
- Finite `y` values are sorted.
- The code computes the 5th and 95th percentiles using the `percentile()` helper.
- Values outside `[lo, hi]` are clipped.
- This reduces the influence of extreme spikes or asymptotes.

#### Normalization
- Computes `yMin` and `yMax` from sampled points.
- If the curve is constant or invalid, defaults to `[-1, 1]`.
- Creates `normalizedY` by mapping each `y` into `[0, 1]` with:
  - `clamp01((p.y - yMin) / (yMax - yMin))`
- This normalized shape is used for shape-based similarity.

#### Slope extraction
- Computes absolute slope magnitude per sample using neighbor points:
  - `dx = next.x - prev.x`
  - `dy = next.y - prev.y`
  - `slope = dy / dx`
  - `rawSlopeAbs[i] = Math.abs(slope)`
- Normalizes slopes to `[0, 1]`.
- This produces `slopeAbs`, which captures how sharply the function changes.

#### Returned `CurveData`
- `expression`: original formula.
- `domain`: `{ xMin, xMax }`.
- `points`: sampled curve points.
- `yBounds`: raw min/max values.
- `normalizedY`: shape normalized to `[0, 1]`.
- `slopeAbs`: normalized absolute slope values.

## Similarity workflow: curve vs song graphs

### `src/utils/similarityEngine.ts`
This module turns two numeric curves into a similarity percentage.

#### Preprocessing functions
- `resampleLinear(series, targetLength)`
  - Resamples any series to a fixed number of points via linear interpolation.
  - Preserves relative shape when lengths differ.

- `sanitize(series)`
  - Replaces non-finite values with the previous valid value.

- `normalize01Robust(series)`
  - Sorts finite values and clips to the 5th/95th percentile range.
  - Linearly scales the result to `[0, 1]`.
  - This is robust to outliers and irregular data.

- `slopeSeries(shape01)`
  - Computes first-difference absolute slope on the normalized series.
  - Scales slopes to `[0, 1]`.

#### Signature features
- `shapeSim` — similarity of the normalized curve shape.
- `slopeSim` — similarity of slope behavior.
- `roughSim` — similarity of roughness (rate of slope variation).
- `peakSim` — similarity of the count of peaks and valleys.

#### Feature extraction helpers
- `roughnessFromSlope(slope01)`
  - Accumulates second-order slope changes: `abs(slope[i] - slope[i - 1])`.
  - Lower values indicate smoother curves.

- `peakCount(shape01)`
  - Counts local extrema where a point is higher or lower than both neighbors.

- `seriesSimilarity(a01, b01)`
  - Computes `1 - mean(abs(a - b))` over the overlapping length.
  - Result is clamped to `[0, 1]`.

- `scalarSimilarity(a, b)`
  - Computes `1 - abs(a - b)/max(abs(a), abs(b), 1e-6)`.
  - Produces a normalized similarity scalar.

#### `similarityPct(aSeries, bSeries)`
- Resamples both series to a fixed length of `160`.
- Normalizes each series robustly.
- Computes the slope series from normalized shapes.
- Evaluates:
  - `shapeSim = seriesSimilarity(aShape, bShape)`
  - `slopeSim = seriesSimilarity(aSlope, bSlope)`
  - `roughSim = scalarSimilarity(roughnessFromSlope(aSlope), roughnessFromSlope(bSlope))`
  - `peakSim = scalarSimilarity(peakCount(aShape), peakCount(bShape))`
- Combines them using weighted blending:
  - `shapeSim * 0.6`
  - `slopeSim * 0.25`
  - `roughSim * 0.1`
  - `peakSim * 0.05`
- Converts the final value to a percentage.

#### `findTopSongMatches(equationGraph, songs, topN, thresholdPct)`
- Scores every song in `songs` with `similarityPct()`.
- Sorts songs by descending similarity.
- Returns the strongest matches.
- If no match exceeds `thresholdPct`, returns the top results anyway.

## Song data and preprocessing

### `src/data/songGraphs.ts`
- Contains the song metadata and precomputed energy graphs.
- Each entry includes `id`, `title`, `artist`, `genre`, `file`, and `graph`.
- `graph` is a normalized array of numbers, typically between `0` and `1`.

### `backend/preprocess_songs.py`
This script converts raw WAV files into the `songGraphs.ts` dataset.

#### Main steps
1. Scans the GTZAN dataset for WAV files.
2. Copies selected audio files into `public/songs/<genre>/...`.
3. Converts audio to mono and float32.
4. Truncates each track to `20` seconds.
5. Splits audio into `100` chunks.
6. Computes RMS energy for each chunk.
7. Normalizes the resulting energy vector to `[0, 1]`.
8. Writes `src/data/songGraphs.ts` with normalized graphs.

#### Key functions
- `song_to_energy_graph(audio_path)`
  - Reads WAV samples.
  - Converts to mono if needed.
  - Computes RMS energy per chunk.
  - Normalizes by min/max.

- `resize_linear(arr, target_len)`
  - Linear interpolation helper for fixed-length outputs.

- `normalize_01(arr)`
  - Maps an array linearly into `[0, 1]`.
  - Handles constant and invalid arrays safely.

- `write_song_graphs_ts(out_path, rows)`
  - Renders the song data as a TypeScript module.

## UI and display components

### `src/components/FunctionInput.tsx`
- Provides buttons for preset expressions.
- Accepts custom expression input.
- Sends updates via `onChangeExpression()`.

### `src/components/GraphCanvas.tsx`
- Draws the curve points to a canvas.
- Handles resizing and animation transitions.
- Visualizes the sampled function or song graph.

### `src/components/CurveInsights.tsx`
- Computes numeric statistics from the curve's `y` values:
  - min/max
  - mean
  - RMS energy
  - standard deviation
  - zero crossings
  - peak count
- Renders a sparkline and summary cards.
- Allows hovering to inspect point positions.

### `src/components/SimilarSongsPanel.tsx`
- Renders song cards for matched results.
- Displays similarity scores and strong match badges.
- Includes an HTML audio player for preview.
- Uses `GraphCanvas` to show each song's energy graph.

### `src/components/MatchExplanationPanel.tsx`
- Explains the four-step workflow:
  1. Equation entry.
  2. Graph sampling.
  3. Audio energy extraction.
  4. Curve fingerprint similarity.

## Supporting modules

### `src/utils/audioEngine.ts`
- Defines `AudioEngine` using `tone.js`.
- Can play a sequence of `NotePoint` values.
- Not currently integrated into `CurveComposerPage`.
- Exposes:
  - oscillator creation
  - gain control
  - scheduling and transport management

### `src/components/FloatingLines.tsx`
- Provides the animated background visual effect.
- Not part of the math or similarity workflow.

## How the matching works in practice
1. User picks or enters a function.
2. `CurveComposerPage` samples it across `-π..π` into `CurveData.points`.
3. The curve is normalized so magnitude differences do not dominate comparison.
4. The normalized shape and its derived slope signature become the search fingerprint.
5. Each song graph is resampled, normalized, and analyzed the same way.
6. Similarity is computed using shape, slope, roughness, and peak structure.
7. Songs are ranked and displayed with similarity percentage.

## Notes
- The app prioritizes shape similarity over raw amplitude.
- Robust normalization and outlier clipping are used in both math and song curves.
- The song dataset is fixed at compile time via `src/data/songGraphs.ts`.
- `backend/preprocess_songs.py` is the source-of-truth for how those graphs were generated.

## File locations and responsibilities
- `src/App.tsx` - entry point.
- `src/components/CurveComposerPage.tsx` - main page and integration hub.
- `src/utils/mathEngine.ts` - math expression sampling and slope extraction.
- `src/utils/similarityEngine.ts` - graph similarity scoring.
- `src/data/songGraphs.ts` - song feature dataset.
- `backend/preprocess_songs.py` - audio preprocessing script.
- `src/components/*` - UI controls, charts, and result panels.
- `public/songs/` - stored song audio files referenced by the dataset.
