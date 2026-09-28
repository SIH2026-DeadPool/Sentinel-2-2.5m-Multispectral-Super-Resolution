
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import time

from inference import (
    super_resolve_geotiff,
    geotiff_to_png
)


app = FastAPI(
    title="SIH Satellite Super-Resolution API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Input-Read-Ms", "X-Inference-Ms"],
)


@app.get("/")
def root():

    return {
        "project":
            "SIH Satellite Super-Resolution",

        "status":
            "running"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    if not file.filename.lower().endswith(
        (".tif", ".tiff")
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload a GeoTIFF "
                "(.tif or .tiff)."
            )
        )

    try:

        read_started = time.perf_counter()
        input_bytes = await file.read()
        input_read_ms = round((time.perf_counter() - read_started) * 1000)

        inference_started = time.perf_counter()
        output_bytes = (
            super_resolve_geotiff(
                input_bytes
            )
        )
        inference_ms = round((time.perf_counter() - inference_started) * 1000)

        return Response(
            content=output_bytes,
            media_type="image/tiff",
            headers={
                "Content-Disposition":
                    "attachment; "
                    "filename=super_resolved.tif",
                "X-Input-Read-Ms": str(input_read_ms),
                "X-Inference-Ms": str(inference_ms)
            }
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/predict-png")
async def predict_png(
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith((".tif", ".tiff")):
        raise HTTPException(status_code=400, detail="Please upload a GeoTIFF (.tif or .tiff).")
    try:
        read_started = time.perf_counter()
        input_bytes = await file.read()
        input_read_ms = round((time.perf_counter() - read_started) * 1000)

        inference_started = time.perf_counter()
        geotiff_bytes = super_resolve_geotiff(input_bytes)
        png_bytes = geotiff_to_png(geotiff_bytes)
        inference_ms = round((time.perf_counter() - inference_started) * 1000)

        return Response(
            content=png_bytes,
            media_type="image/png",
            headers={
                "Content-Disposition": "attachment; filename=super_resolved.png",
                "X-Input-Read-Ms": str(input_read_ms),
                "X-Inference-Ms": str(inference_ms)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

