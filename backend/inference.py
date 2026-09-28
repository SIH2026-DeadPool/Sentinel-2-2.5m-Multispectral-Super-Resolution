
import os
import numpy as np
import torch
import rasterio

from rasterio.io import MemoryFile

from model import FastSEN2SR


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "best_fast_model.pth"
)

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


def load_model():

    model = FastSEN2SR(
        in_channels=4,
        out_channels=4,
        dim=32
    ).to(DEVICE)

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    return model


MODEL = load_model()


def super_resolve_geotiff(
    input_bytes
):

    with MemoryFile(
        input_bytes
    ) as memfile:

        with memfile.open() as src:

            image = src.read()

            profile = src.profile.copy()

    if image.shape[0] != 4:

        raise ValueError(
            "Input must contain exactly "
            "4 bands: B2, B3, B4, B8."
        )

    original_height = image.shape[1]
    original_width = image.shape[2]

    # Sentinel-2 normalization
    image = image.astype(
        np.float32
    )

    image = np.clip(
        image / 3000.0,
        0,
        1
    )

    tensor = torch.from_numpy(
        image.copy()
    ).unsqueeze(0).to(
        DEVICE
    )

    with torch.no_grad():

        output = MODEL(
            tensor
        )

    output = (
        output[0]
        .cpu()
        .numpy()
    )

    # Convert back to approximate
    # Sentinel reflectance scale
    output = (
        np.clip(
            output,
            0,
            1
        )
        * 3000.0
    ).astype(
        np.float32
    )

    new_height = original_height * 4
    new_width = original_width * 4

    # Update geospatial transform
    transform = profile.get(
        "transform"
    )

    if transform is not None:

        transform = transform * transform.scale(
            original_width / new_width,
            original_height / new_height
        )

    profile.update(
        {
            "height": new_height,
            "width": new_width,
            "count": 4,
            "dtype": "float32",
            "transform": transform
        }
    )

    with MemoryFile() as memfile:

        with memfile.open(
            **profile
        ) as dst:

            dst.write(
                output
            )

        return memfile.read()


def geotiff_to_png(tiff_bytes):
    import io
    from PIL import Image

    with MemoryFile(tiff_bytes) as memfile:
        with memfile.open() as src:
            data = src.read()

    # Extract True Color RGB: Red (B4 -> index 2), Green (B3 -> index 1), Blue (B2 -> index 0)
    r = data[2]
    g = data[1]
    b = data[0]

    rgb = np.stack([r, g, b], axis=-1)

    p2, p98 = np.percentile(rgb, (2, 98))
    if p98 > p2:
        rgb_norm = np.clip((rgb - p2) / (p98 - p2), 0, 1)
    else:
        rgb_norm = np.clip(rgb / 3000.0, 0, 1)

    rgb_uint8 = (rgb_norm * 255.0).astype(np.uint8)

    img = Image.fromarray(rgb_uint8)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()

