# FastSEN2SR Satellite Super-Resolution

FastSEN2SR is an AI-based super-resolution prototype for four-band Sentinel-2 multispectral imagery. The project accepts B2, B3, B4, and B8 GeoTIFF input and produces an estimated 4x super-resolved GeoTIFF.

The project contains two frontend options:

- A React + Vite frontend with the cinematic workspace and real upload workflow.
- The original Streamlit prototype, retained for compatibility.

The FastAPI backend and model code are shared by both frontends.

## Repository Layout

```text
project-root/
├── backend/
│   ├── app.py                  FastAPI application
│   ├── inference.py            GeoTIFF loading and inference pipeline
│   ├── model.py                FastSEN2SR architecture
│   ├── requirements.txt        Backend dependencies
│   └── best_fast_model.pth     Local model weight, supplied separately
├── frontend/
│   ├── src/                    React + TypeScript application
│   ├── public/visuals/         Local visual assets
│   ├── app.py                  Streamlit prototype
│   ├── package.json             Vite scripts and JavaScript dependencies
│   └── requirements.txt        Streamlit dependencies
├── SIH_Satellite_SR/
│   ├── cache/                  Local training tensor caches, not runtime files
│   ├── checkpoints/             Training checkpoint copy, ignored by Git
│   └── results/                Training and evaluation outputs
└── results/                    Project result images and metrics
```

## Prerequisites

- Windows, macOS, or Linux
- Python 3.10 or newer
- Node.js 20 or newer and npm
- Enough disk space for PyTorch, Rasterio, and the Python environment
- The supplied `best_fast_model.pth` weight file

The model weight and training caches are intentionally excluded from GitHub. They must be supplied manually.

## 1. Clone the Repository

```bash
git clone https://github.com/SIH2026-DeadPool/Sentinel-2-2.5m-Multispectral-Super-Resolution.git
cd Sentinel-2-2.5m-Multispectral-Super-Resolution
```

Place the model weight at this exact path:

```text
backend/best_fast_model.pth
```

The backend loads this path from `backend/inference.py`. Do not place model weights in the React frontend.

## 2. Create the Python Environment

From the repository root:

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

If PowerShell blocks activation, run the commands without activation:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

## 3. Start the FastAPI Backend

Run this from the repository root so the backend module path is unambiguous:

### Windows PowerShell

```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
```

### macOS/Linux

```bash
.venv/bin/python -m uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000
```

Keep this terminal running. Check that the API is healthy at `http://127.0.0.1:8000/health`.

Expected response:

```json
{ "status": "healthy" }
```

If port 8000 is already in use, do not start another backend. Check the existing service first. On Windows:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Get-NetTCPConnection -LocalPort 8000 -State Listen
```

## 4. Start the React Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`.

The React frontend uses `http://127.0.0.1:8000` by default. To use another backend URL, create `frontend/.env.local`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Restart Vite after changing the environment file.

To create a production bundle:

```powershell
npm run build
```

To preview the production bundle:

```powershell
npm run preview
```

## 5. Use the React Upload Workflow

1. Open the React frontend.
2. Select or drop a `.tif` or `.tiff` file into the workspace.
3. Confirm the selected filename.
4. Choose **Run super-resolution**.
5. The interface reports measured browser upload progress.
6. After transfer completes, it displays an honest model-processing state without inventing an inference percentage.
7. Download the returned `*_sr.tif` file after inference completes.

The backend expects a GeoTIFF containing exactly four bands in this order:

```text
B2, B3, B4, B8
```

The backend returns a four-band GeoTIFF with width and height scaled by 4. The output is an estimated super-resolved product, not a literal physical Sentinel-2 measurement at 2.5 m.

## 6. API Contract

### Health check

```http
GET /health
```

### Prediction

```http
POST /predict
Content-Type: multipart/form-data
```

The multipart field must be named `file` and the filename must end in `.tif` or `.tiff`.

Example with curl:

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -F "file=@path/to/input.tif" \
  -o output_sr.tif
```

The response is `image/tiff`. The backend also exposes timing headers for the React client:

- `X-Input-Read-Ms`
- `X-Inference-Ms`

## 7. Run the Streamlit Prototype

The original Streamlit application remains available and is separate from the React frontend.

Open another terminal from the repository root:

```powershell
python -m pip install -r frontend\requirements.txt
cd frontend
streamlit run app.py
```

The Streamlit prototype uses the same backend API. Start FastAPI before using it.

## Model and Training Directory

`SIH_Satellite_SR/` is retained at the repository root. Its training caches and checkpoint files are not required to run the React or Streamlit applications. The runtime backend uses the manually supplied file at `backend/best_fast_model.pth` and the exact architecture in `backend/model.py`.

The model was produced for rapid Smart India Hackathon prototyping using a reduced representative dataset. Avoid presenting the generated output as a scientific guarantee or as literal 2.5 m Sentinel-2 measurements.

## Results

Project results and metrics are available in:

- `results/`
- `SIH_Satellite_SR/results/`

These include comparison images, band visualizations, estimated NDVI output, training curves, and final metrics.

## GitHub Notes

The repository ignores local environments, JavaScript dependencies, generated frontend output, model weights, and training tensor caches. Before pushing, verify that weights are not staged:

```powershell
git status --short --ignored
git check-ignore -v backend\best_fast_model.pth
```

Do not use `git add -f` on model weights or cache files. Supply the model manually after cloning.
