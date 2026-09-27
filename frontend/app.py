
import io
import requests
import streamlit as st
import rasterio

from rasterio.io import MemoryFile

import numpy as np


BACKEND_URL = (
    "http://localhost:8000"
)


st.set_page_config(
    page_title="Satellite Super-Resolution",
    layout="wide"
)


st.title(
    "Satellite Image Super-Resolution"
)

st.write(
    "AI-based 4× super-resolution "
    "for Sentinel-2 multispectral imagery."
)


uploaded_file = st.file_uploader(
    "Upload a 4-band Sentinel-2 GeoTIFF",
    type=["tif", "tiff"]
)


if uploaded_file is not None:

    st.success(
        "Image uploaded."
    )

    if st.button(
        "Enhance Image"
    ):

        with st.spinner(
            "Running super-resolution..."
        ):

            response = requests.post(
                f"{BACKEND_URL}/predict",
                files={
                    "file": (
                        uploaded_file.name,
                        uploaded_file.getvalue(),
                        "image/tiff"
                    )
                }
            )

        if response.status_code != 200:

            st.error(
                response.text
            )

        else:

            st.success(
                "Super-resolution completed."
            )

            output_bytes = (
                response.content
            )

            with MemoryFile(
                output_bytes
            ) as memfile:

                with memfile.open() as src:

                    output = src.read()

            # RGB preview
            rgb = output[
                [2, 1, 0]
            ].astype(
                np.float32
            )

            rgb = rgb / 3000.0

            rgb = np.clip(
                rgb,
                0,
                1
            )

            rgb = np.transpose(
                rgb,
                (1, 2, 0)
            )

            st.subheader(
                "Super-Resolved RGB"
            )

            st.image(
                rgb,
                use_container_width=True
            )

            st.download_button(
                "Download Super-Resolved GeoTIFF",
                data=output_bytes,
                file_name="super_resolved.tif",
                mime="image/tiff"
            )
