# CurveComposer

CurveComposer is a React + TypeScript web app that converts mathematical equations into graph shapes and finds songs with similar audio energy patterns.

<img width="2559" height="1599" alt="image" src="https://github.com/user-attachments/assets/249b1645-ae99-40b2-9f90-9f8f677ea446" />

---

## Project Overview

Users can enter equations such as:

```txt
sin(x)
x^2
sin(x) + cos(2*x)
```

The app converts the equation into a curve, analyzes its shape, and compares it with preprocessed song energy graphs. The most similar songs are then ranked and displayed with similarity percentages.

---

## Main Features

* Enter custom mathematical equations
* Select preset equations
* Generate a visual graph from the equation
* Analyze graph shape, slope, peaks, and roughness
* Compare equation graphs with song energy graphs
* Show similar songs with match percentage
* Preview matched song graphs
* Play matched audio files

---

## How It Works

1. The user enters a math equation.
2. The app samples the equation across a fixed x-range.
3. The sampled values are converted into a graph.
4. The graph is normalized so different equations can be compared fairly.
5. Each song is already converted into an energy graph.
6. The app compares the equation graph with each song graph.
7. Songs are ranked based on similarity score.

---

## Similarity Matching

The matching system compares four main features:

| Feature              | Weight | Meaning                                  |
| -------------------- | -----: | ---------------------------------------- |
| Shape similarity     |    60% | How similar the overall graph shapes are |
| Slope similarity     |    25% | How similarly the graphs rise and fall   |
| Roughness similarity |    10% | How smooth or chaotic the graphs are     |
| Peak similarity      |     5% | How similar the peaks and valleys are    |

The final score is shown as a similarity percentage.

---

## Tech Stack

* React
* TypeScript
* Vite
* MathJS
* Python
* GTZAN music dataset

---

## Project Structure

```txt
CurveComposer/
│
├── backend/
│   └── preprocess_songs.py
│
├── public/
│   └── songs/
│
├── src/
│   ├── components/
│   │   ├── CurveComposerPage.tsx
│   │   ├── FunctionInput.tsx
│   │   ├── GraphCanvas.tsx
│   │   ├── SimilarSongsPanel.tsx
│   │   ├── CurveInsights.tsx
│   │   └── MatchExplanationPanel.tsx
│   │
│   ├── data/
│   │   └── songGraphs.ts
│   │
│   ├── utils/
│   │   ├── mathEngine.ts
│   │   ├── similarityEngine.ts
│   │   └── audioEngine.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
└── README.md
```

---

## Important Files

### `src/utils/mathEngine.ts`

Converts a mathematical expression into graph data. It samples the equation, handles invalid values, normalizes the curve, and calculates slope information.

### `src/utils/similarityEngine.ts`

Compares the equation graph with song graphs. It calculates shape, slope, roughness, and peak similarity, then returns a final match percentage.

### `src/data/songGraphs.ts`

Stores preprocessed song information and graph data.

### `backend/preprocess_songs.py`

Processes audio files from the dataset. It converts each song into a normalized energy graph and writes the output into `songGraphs.ts`.

### `src/components/CurveComposerPage.tsx`

Main page of the app. It connects the input, graph display, similarity engine, and matched song results.

---

## Installation

Clone the project:

```bash
git clone <your-repository-url>
cd CurveComposer
```

Install dependencies:

```bash
npm install
```

Run the project:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```txt
http://localhost:5173
```

---

## Required Dependencies

Install these if they are missing:

```bash
npm install mathjs
```

If using animations or audio features:

```bash
npm install motion tone
```

---

## Dataset / Song Processing

This project uses preprocessed songs. Raw audio files are converted into graph data using the Python script:

```bash
python backend/preprocess_songs.py
```

The script:

* Reads WAV audio files
* Converts songs to mono
* Cuts audio to a fixed duration
* Splits audio into chunks
* Calculates RMS energy
* Normalizes the energy values
* Generates `src/data/songGraphs.ts`

---

## Example Usage

1. Open the app.
2. Enter an equation like:

```txt
sin(x)
```

3. The app draws the graph.
4. Similar songs are shown on the right side.
5. Each song displays:

   * title
   * artist
   * genre
   * similarity percentage
   * graph preview
   * audio player

---

## Presentation Explanation

CurveComposer is a creative web app that connects math and music. It lets users type a mathematical equation, converts it into a graph, and then finds songs that have similar audio patterns. Each song is represented as a graph based on its loudness over time. The system compares the equation graph with song graphs and shows the closest matches.

---

## Advantages

* Creative and unique idea
* Makes math and music more interactive
* Helps users understand patterns visually
* Provides a new way to discover songs
* Uses real data processing and similarity matching
* Can be expanded with more songs or AI features

---

## Limitations

* It compares songs using energy patterns only
* It does not understand lyrics, melody, or emotions directly
* Accuracy depends on the quality and size of the song dataset
* Some different songs may have similar energy graphs

---

## Future Improvements

* Add more songs and genres
* Use machine learning for better matching
* Allow users to upload their own songs
* Compare melody, rhythm, and tempo
* Add real-time drawing input
* Improve recommendation accuracy

---

## Conclusion

CurveComposer shows that both math and music are built from patterns. By converting equations and songs into graph shapes, the app creates a unique way to explore and discover music through mathematics.
