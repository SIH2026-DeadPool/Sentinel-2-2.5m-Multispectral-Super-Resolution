# SIH Satellite Super-Resolution

AI-based 4x super-resolution prototype for
4-band Sentinel-2 multispectral imagery.

## Trained Model

Architecture:

FastSEN2SR

Input:
4 bands — B2, B3, B4, B8

Input resolution:
10 m

Output scale:
4x

Target:
approximately 2.5 m super-resolved product

The trained weights are:

backend/best_fast_model.pth

The weight file is intentionally excluded from Git because it is a binary
model artifact. After cloning, place the manually supplied weight at
`backend/best_fast_model.pth` before starting the backend. The
`SIH_Satellite_SR/cache/` tensor caches are also local training artifacts and
are not required by the frontend or API runtime.

## Backend

The backend uses FastAPI.

Install:

pip install -r backend/requirements.txt

Run:

cd backend

uvicorn app:app --host 0.0.0.0 --port 8000

API:

GET /
GET /health
POST /predict

The /predict endpoint accepts a
4-band GeoTIFF and returns a
4-band super-resolved GeoTIFF.

## Frontend

The frontend uses Streamlit.

Install:

pip install -r frontend/requirements.txt

Run:

cd frontend

streamlit run app.py

The frontend uploads a GeoTIFF to
the backend and displays the RGB
super-resolved result.

## Important

The backend must use the exact
FastSEN2SR architecture in model.py
when loading best_fast_model.pth.

The trained model was produced using
a reduced representative dataset for
rapid SIH prototyping.

The output should be described as an
estimated super-resolved product, not
as literal physical Sentinel-2
measurements at 2.5 m.

## Results

See the results/ directory for:

- final_metrics.txt
- main_comparison.png
- sr_bands.png
- estimated_ndvi.png
- training_curve.png
